// src/consumers/sessionConsumer.js
const { Kafka } = require("kafkajs");
const { createClient } = require("@clickhouse/client");
const getRedis = require("../redis/redisClient");

// -------------------------------------------------
// CONFIG
// -------------------------------------------------
const KAFKA_BROKERS = ["localhost:9092", "localhost:9094", "localhost:9095"];
const KAFKA_GROUP_ID = "session-processor";
const TOPIC = "web-events";

const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const SESSION_TTL_SEC = SESSION_TIMEOUT_MS / 1000;

const ACTIVE_TYPES = new Set([
  "heartbeat",
  "action",
  "visibility_change",
  "page_view"
]);

// -------------------------------------------------
// CLICKHOUSE
// -------------------------------------------------
const clickhouse = createClient({
  host: "http://localhost:8123",
  username: "default",
  password: "",
  database: "analytics"
});

// ClickHouse batching
let chBuffer = [];
let chLastFlush = Date.now();
const CH_BATCH_SIZE = 500;
const CH_FLUSH_INTERVAL = 1000;

// -------------------------------------------------
// SESSION VALIDATION STATE (your old logic)
// -------------------------------------------------
const sessionLifecycle = new Map(); // { started: bool, closed: bool }

// -------------------------------------------------
// SESSION STORE (unchanged end-session store)
// -------------------------------------------------
const sessions = new Map();

const PRODUCT_REGEX = /all-products\/product\/[A-Za-z0-9\-]+$/;

// -------------------------------------------------
// HELPERS
// -------------------------------------------------
function toMs(ts) {
  if (ts == null) return null;
  if (typeof ts === "number") return ts;
  const n = Number(ts);
  if (!isNaN(n)) return n;
  const d = new Date(ts).getTime();
  return isNaN(d) ? null : d;
}

// -------------------------------------------------
// CLICKHOUSE FLUSHER
// -------------------------------------------------
async function flushCH() {
  if (chBuffer.length === 0) return;

  const batch = chBuffer.splice(0, chBuffer.length);

  try {
    await clickhouse.insert({
      table: "sessions",
      values: batch,
      format: "JSONEachRow"
    });
  } catch (err) {
    console.error("❌ ClickHouse batch insert failed:", err);
  }

  chLastFlush = Date.now();
}

setInterval(flushCH, CH_FLUSH_INTERVAL);

// -------------------------------------------------
// REDIS ACTIVE SESSION MATERIALIZER (optimized)
// -------------------------------------------------
async function updateRedisActiveSession(redis, event) {
  const sid = event.sessionId;
  const key = `active:${sid}`;

  if (event.type === "page_exit") {
    await redis.del(key);
    return;
  }

  // MULTI = atomic pipeline, 1 round-trip
  await redis
    .multi()
    .hSet(key, {
      sessionId: sid,
      visitorId: event.userId,
      lastEventTime: event.timestamp,
      lastEventType: event.type,
      url: event.url || ""
    })
    .expire(key, SESSION_TTL_SEC)
    .exec();
}

// -------------------------------------------------
// END SESSION → CLICKHOUSE (unchanged, but batched)
// -------------------------------------------------
function queueSessionFlush(session, endTimestampMs) {
  const startMs = session.startTime;
  const endMs = endTimestampMs || session.lastEventTime || Date.now();

  let totalIdleMs = session.totalIdleMs || 0;
  if (session.idleStart) {
    totalIdleMs += Math.max(0, endMs - session.idleStart);
  }

  const dwellMs = Math.max(0, (endMs - startMs) - totalIdleMs);

  let urlMostActive = "";
  let maxActions = 0;
  for (const [url, count] of Object.entries(session.urlActionCounts)) {
    if (count > maxActions) {
      maxActions = count;
      urlMostActive = url;
    }
  }

  chBuffer.push({
    sessionId: session.sessionId,
    visitorId: session.visitorId,
    startTime: new Date(startMs).toISOString().slice(0, 19).replace("T", " "),
    endTime: new Date(endMs).toISOString().slice(0, 19).replace("T", " "),
    urlStart: session.urlStart || "",
    urlEnd: session.urlEnd || "",
    totalIdleSeconds: Math.floor(totalIdleMs / 1000),
    dwellSeconds: Math.floor(dwellMs / 1000),
    totalClicks: session.totalClicks || 0,
    totalActions: session.totalActions || 0,
    totalPageViews: session.totalPageViews || 0,
    productViews: session.productViewSet.size,
    urlMostActive
  });

  if (chBuffer.length >= CH_BATCH_SIZE) {
    flushCH();
  }
}

// -------------------------------------------------
// EVENT HANDLER
// -------------------------------------------------
async function handleEvent(event, redis) {
  let ts = toMs(event.timestamp);
  if (ts == null) ts = Date.now();
  event.timestamp = ts;

  const sid = event.sessionId;
  const uid = event.userId;
  const url = event.url || "";

  // -------------------------------------------------
  // SESSION LIFECYCLE VALIDATION (your old logic)
  // -------------------------------------------------
  let lifecycle = sessionLifecycle.get(sid);

  if (!lifecycle) {
    if (event.type !== "page_view") return;
    lifecycle = { started: true, closed: false };
    sessionLifecycle.set(sid, lifecycle);
  }

  if (lifecycle.closed) return;

  if (event.type === "page_exit") {
    lifecycle.closed = true;
    sessionLifecycle.set(sid, lifecycle);
  }

  // -------------------------------------------------
  // REDIS ACTIVE SESSION MATERIALIZER
  // -------------------------------------------------
  await updateRedisActiveSession(redis, event);

  // -------------------------------------------------
  // END SESSION METRICS (unchanged)
  // -------------------------------------------------
  let s = sessions.get(sid);

  // Create session on first page_view
  if (!s && event.type === "page_view") {
    s = {
      sessionId: sid,
      visitorId: uid,
      startTime: ts,
      lastEventTime: ts,
      urlStart: url,
      urlEnd: url,
      idleStart: null,
      totalIdleMs: 0,
      totalClicks: 0,
      totalActions: 0,
      totalPageViews: 0,
      urlActionCounts: {},
      productViewSet: new Set()
    };
    sessions.set(sid, s);
  }

  // Ignore events for sessions never started
  if (!s) return;

  // UPDATE METRICS
  s.lastEventTime = ts;

  const isProduct = PRODUCT_REGEX.test(url);

  if (event.type === "page_view") {
    s.totalPageViews++;
    s.urlEnd = url;
  }

  if (event.type === "action") {
    s.totalActions++;
    if (event.action === "click") s.totalClicks++;
    s.urlActionCounts[url] = (s.urlActionCounts[url] || 0) + 1;
    s.urlEnd = url;
  }

  if (isProduct) s.productViewSet.add(url);

  if (ACTIVE_TYPES.has(event.type)) {
    if (s.idleStart) {
      s.totalIdleMs += ts - s.idleStart;
      s.idleStart = null;
    }
  }

  if (event.type === "idle") {
    if (!s.idleStart) s.idleStart = ts;
  }

  if (event.type === "page_exit") {
    if (s.idleStart) {
      s.totalIdleMs += ts - s.idleStart;
      s.idleStart = null;
    }
    queueSessionFlush(s, ts);
    sessions.delete(sid);
  }
}

// -------------------------------------------------
// MAIN CONSUMER START
// -------------------------------------------------
async function EndSessionConsumerStart() {
  const redis = await getRedis();

  // Clear old active sessions at boot
  const keys = await redis.keys("active:*");
  for (const k of keys) await redis.del(k);

  console.log("Redis ready, Kafka starting...");

  const kafka = new Kafka({ brokers: KAFKA_BROKERS });
  const consumer = kafka.consumer({ groupId: KAFKA_GROUP_ID });

  await consumer.connect();
  await consumer.subscribe({ topic: TOPIC, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const ev = JSON.parse(message.value.toString());

        const event = {
          timestamp: ev.timestamp ?? Date.now(),
          type: ev.type ?? ev.eventType ?? null,
          userId: ev.userId ?? ev.visitorId ?? null,
          sessionId: ev.sessionId ?? ev.sid ?? null,
          url: ev.url ?? "",
          action: ev.action ?? null
        };

        if (!event.sessionId || !event.type) return;

        await handleEvent(event, redis);

      } catch (err) {
        console.error("❌ Error processing message:", err);
      }
    }
  });
}

if (require.main === module) {
  EndSessionConsumerStart().catch(err => {
    console.error("Fatal consumer error:", err);
    process.exit(1);
  });
}

module.exports = { EndSessionConsumerStart };
