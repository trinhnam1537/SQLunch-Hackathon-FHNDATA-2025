// src/consumers/sessionConsumer.js
const { Kafka } = require("kafkajs");
const { createClient } = require("@clickhouse/client");

// Config
const KAFKA_BROKERS = ["localhost:9092", "localhost:9094", "localhost:9095"];
const KAFKA_GROUP_ID = "session-processor";
const TOPIC = "web-events";

// session timeout = if no events for this long, we consider session closed (ms)
const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

// ClickHouse client (adjust host/user/password/database as needed)
const clickhouse = createClient({
  host: "http://localhost:8123",
  username: "default",
  password: "",
  database: "analytics"
});

// Kafka setup
const kafka = new Kafka({ brokers: KAFKA_BROKERS });
const consumer = kafka.consumer({ groupId: KAFKA_GROUP_ID });

// In-memory session store (structure below). Replace with Redis if you need durability.
const sessions = new Map();
// session structure:
// {
//   sessionId,
//   visitorId,
//   startTime (ms),
//   urlStart,
//   lastEventTime (ms),  // last seen event timestamp
//   idleStart (ms|null), // when idle started
//   totalIdleMs (number),
//   urlEnd
// }

function toMs(ts) {
  // support ts being epoch ms or JS Date or string
  if (!ts) return null;
  if (typeof ts === "number") return ts;
  const n = Number(ts);
  if (!isNaN(n)) return n;
  const d = new Date(ts);
  return d.getTime();
}

async function flushSessionToClickHouse(session, endTimestampMs) {
  // compute final end time
  const startMs = session.startTime;
  const endMs = endTimestampMs || session.lastEventTime;
  // if session had an open idle at close, count idle up to endMs
  let totalIdleMs = session.totalIdleMs || 0;
  if (session.idleStart) {
    totalIdleMs += Math.max(0, endMs - session.idleStart);
  }

  const dwellMs = Math.max(0, (endMs - startMs) - totalIdleMs);
  const row = {
    sessionId: session.sessionId,
    visitorId: session.visitorId,
    startTime: new Date(startMs).toISOString().slice(0, 19).replace("T", " "),
    endTime: new Date(endMs).toISOString().slice(0, 19).replace("T", " "),
    urlStart: session.urlStart || "",
    urlEnd: session.urlEnd || "",
    totalIdleSeconds: Math.floor(totalIdleMs / 1000),
    dwellSeconds: Math.floor(dwellMs / 1000)
  };

  try {
    await clickhouse.insert({
      table: "sessions",
      // JSONEachRow format is easy for objects
      values: [row],
      format: "JSONEachRow"
    });
    console.log("✅ flushed session to ClickHouse:", row.sessionId, "dwell:", row.dwellSeconds, "s");
  } catch (err) {
    console.error("❌ failed writing session to ClickHouse", err);
  }
}

function handleEvent(event) {
  // event (from Kafka) expected shape:
  // { timestamp, eventType, visitorId, sessionId, url, action }
  const tsMs = toMs(event.timestamp);
  const sessId = String(event.sessionId);
  let s = sessions.get(sessId);

  if (!s && event.eventType === "page_view") {
    // create a new session on page_view
    s = {
      sessionId: sessId,
      visitorId: event.visitorId || "",
      startTime: tsMs,
      urlStart: event.url || "",
      lastEventTime: tsMs,
      idleStart: null,
      totalIdleMs: 0,
      urlEnd: event.url || ""
    };
    sessions.set(sessId, s);
    return;
  }

  // If session doesn't exist but we got other events (activity, heartbeat, page_exit),
  // we can create a best-effort session (use first event as start)
  if (!s) {
    s = {
      sessionId: sessId,
      visitorId: event.visitorId || "",
      startTime: tsMs,
      urlStart: event.url || "",
      lastEventTime: tsMs,
      idleStart: null,
      totalIdleMs: 0,
      urlEnd: event.url || ""
    };
    sessions.set(sessId, s);
  }

  // Update lastEventTime in any case
  s.lastEventTime = Math.max(s.lastEventTime || 0, tsMs);

  switch (event.eventType) {
    case "idle":
      // mark idle start only if not already idling
      if (!s.idleStart) s.idleStart = tsMs;
      break;

    case "activity":
    case "heartbeat":
    case "visibility_change":
    case "page_view":
      // if we were idling, add gap from idleStart -> this event
      if (s.idleStart) {
        const gap = Math.max(0, tsMs - s.idleStart);
        s.totalIdleMs = (s.totalIdleMs || 0) + gap;
        s.idleStart = null;
      }
      // update url/end info for activity or page_view
      if (event.url) s.urlEnd = event.url;
      break;

    case "page_exit":
      // count any open idle up to page_exit time
      if (s.idleStart) {
        const gap = Math.max(0, tsMs - s.idleStart);
        s.totalIdleMs = (s.totalIdleMs || 0) + gap;
        s.idleStart = null;
      }
      // finalize session: flush to ClickHouse, then remove state
      if (event.url) s.urlEnd = event.url;
      flushSessionToClickHouse(s, tsMs).catch(console.error);
      sessions.delete(sessId);
      break;

    default:
      // unknown eventType -> treat as activity (safe default)
      if (s.idleStart) {
        const gap = Math.max(0, tsMs - s.idleStart);
        s.totalIdleMs = (s.totalIdleMs || 0) + gap;
        s.idleStart = null;
      }
      break;
  }
}

// Periodic sweeper: close sessions that have been idle/no events for SESSION_TIMEOUT_MS
async function sweepSessions() {
  const now = Date.now();
  for (const [sessionId, s] of sessions.entries()) {
    if (now - (s.lastEventTime || 0) >= SESSION_TIMEOUT_MS) {
      // treat as session close by timeout
      console.log("⏳ session timeout flush:", sessionId);
      await flushSessionToClickHouse(s, s.lastEventTime || now);
      sessions.delete(sessionId);
    }
  }
}

async function EndSessionConsumerStart() {
  await consumer.connect();
  console.log("Kafka consumer connected");
  await consumer.subscribe({ topic: TOPIC, fromBeginning: false });

  // Start sweeper: every minute
  setInterval(() => {
    sweepSessions().catch(err => console.error("Sweeper error:", err));
  }, 60 * 1000);

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const raw = message.value.toString();
        const event = JSON.parse(raw);

        // MAP to correct field names
        const mappedEvent = {
          timestamp: event.timestamp,
          eventType: event.type,
          visitorId: event.userId,
          sessionId: event.sessionId,
          url: event.url,
          action: event.action
        };

        handleEvent(mappedEvent);

      } catch (err) {
        console.error("Error processing message:", err);
      }
    }
  });
}

// Self-run if executed directly
if (require.main === module) {
  start().catch(err => {
    console.error("Fatal consumer error:", err);
    process.exit(1);
  });
}

module.exports = { EndSessionConsumerStart };
