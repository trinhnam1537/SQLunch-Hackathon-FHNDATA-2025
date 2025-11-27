// const { Kafka } = require("kafkajs");

// const kafka = new Kafka({
//   brokers: ["localhost:9092", "localhost:9094", "localhost:9095"]
// });

// const consumer = kafka.consumer({ groupId: "web-events-debug" });

// async function startConsumer() {
//   await consumer.connect();
//   console.log("Kafka consumer connected");

//   await consumer.subscribe({ topic: "web-events", fromBeginning: false });

//   await consumer.run({
//     eachMessage: async ({ topic, partition, message }) => {
//       const raw = message.value.toString();
//       const event = JSON.parse(raw);

//       console.log("\n=== NEW EVENT RECEIVED ===");
//       console.log("Topic:", topic);
//       console.log("Partition:", partition);
//       console.log("Offset:", message.offset);
//       console.log("Event:", event);
//     }
//   });
// }

// module.exports = { startConsumer };



// src/consumer.js
const { Kafka } = require("kafkajs");
const { createClient } = require('@clickhouse/client');

const sessionState = new Map(); 

// --- KAFKA SETUP ---
const kafka = new Kafka({
  brokers: ["localhost:9092", "localhost:9094", "localhost:9095"]
});

const consumer = kafka.consumer({ groupId: "web-events-debug" });

// --- CLICKHOUSE CLIENT ---
const clickhouse = createClient({
  host: "http://localhost:8123",
  username: "default",
  password: "",
  database: "kafka"
});

async function RawIngestConsumerStart() {
  await consumer.connect();
  console.log("Kafka consumer connected");

  await consumer.subscribe({ topic: "web-events", fromBeginning: false });

await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    const raw = message.value.toString();
    const event = JSON.parse(raw);

    const sessionId = event.sessionId;
    const eventType = event.type;

    // If sessionId empty, ignore
    if (!sessionId) return;

    let state = sessionState.get(sessionId);

    if (!state) {
      // First time we see this session
      if (eventType !== "page_view") {
        // ❌ Invalid start → discard quietly
        return;
      }

      // This is a valid start
      state = { started: true, closed: false };
      sessionState.set(sessionId, state);
    }

    // If session already closed earlier → ignore any more events
    if (state.closed) return;

    // If this event is page_exit → mark session closed
    if (eventType === "page_exit") {
      state.closed = true;
      sessionState.set(sessionId, state);
    }

    // Build ClickHouse row
    const row = {
      timestamp: new Date(event.timestamp)
        .toISOString()
        .slice(0, 19)
        .replace("T", " "),
      eventType,
      visitorId: event.userId || "",
      sessionId,
      url: event.url || "",
      action: event.action || ""
    };

    try {
      await clickhouse.insert({
        table: "events",
        values: [row],
        format: "JSONEachRow"
      });
    } catch (err) {
      console.error("❌ INSERT FAILED:", err);
    }
  }
});

}

// ---- RUN IMMEDIATELY (like your working version) ----
// startConsumer();  

// Export anyway (optional)
module.exports = { RawIngestConsumerStart };
