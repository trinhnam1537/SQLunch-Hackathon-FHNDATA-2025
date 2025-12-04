
// // src/consumer.js
// const { Kafka } = require("kafkajs");
// const { createClient } = require('@clickhouse/client');

// const sessionState = new Map(); 

// // --- KAFKA SETUP ---
// const kafka = new Kafka({
//   brokers: ["localhost:9092", "localhost:9094", "localhost:9095"]
// });

// const consumer = kafka.consumer({ groupId: "web-events-debug" });

// // --- CLICKHOUSE CLIENT ---
// const clickhouse = createClient({
//   host: "http://localhost:8123",
//   username: "default",
//   password: "",
//   database: "kafka"
// });

// async function RawIngestConsumerStart() {
//   await consumer.connect();
//   console.log("Kafka consumer connected");

//   await consumer.subscribe({ topic: "web-events", fromBeginning: false });

// await consumer.run({
//   eachMessage: async ({ topic, partition, message }) => {
//     const raw = message.value.toString();
//     const event = JSON.parse(raw);

//     const sessionId = event.sessionId;
//     const eventType = event.type;

//     // If sessionId empty, ignore
//     if (!sessionId) return;

//     let state = sessionState.get(sessionId);

//     if (!state) {
//       // First time we see this session
//       if (eventType !== "page_view") {
//         // ❌ Invalid start → discard quietly
//         return;
//       }

//       // This is a valid start
//       state = { started: true, closed: false };
//       sessionState.set(sessionId, state);
//     }

//     // If session already closed earlier → ignore any more events
//     if (state.closed) return;

//     // If this event is page_exit → mark session closed
//     if (eventType === "page_exit") {
//       state.closed = true;
//       sessionState.set(sessionId, state);
//     }

//     // Build ClickHouse row
//     const row = {
//       timestamp: new Date(event.timestamp)
//         .toISOString()
//         .slice(0, 19)
//         .replace("T", " "),
//       eventType,
//       visitorId: event.userId || "",
//       sessionId,
//       url: event.url || "",
//       action: event.action || ""
//     };

//     try {
//       await clickhouse.insert({
//         table: "events",
//         values: [row],
//         format: "JSONEachRow"
//       });
//     } catch (err) {
//       console.error("❌ INSERT FAILED:", err);
//     }
//   }
// });

// }

// // ---- RUN IMMEDIATELY (like your working version) ----
// // startConsumer();  

// // Export anyway (optional)
// module.exports = { RawIngestConsumerStart };
const { EventHubConsumerClient } = require("@azure/event-hubs");
require("dotenv").config();

const CONNECTION_STRING = process.env.EVENTHUB_CONNECTION_SECOND;
const CONSUMER_GROUP = process.env.EH_CONSUMER_GROUP || "$Default";

// ----------------------------------------
// ACTIVE SESSIONS = in-memory Map
// KEY: sessionId
// VALUE: last event (optional)
// ----------------------------------------
const activeSessions = new Map();

// export so other files can read activeSessions.size, list, etc.
module.exports.activeSessions = activeSessions;

// ----------------------------------------
// START CONSUMER
// ----------------------------------------
async function startConsumer() {
  if (!CONNECTION_STRING) throw new Error("EVENTHUB_CONNECTION_SECOND missing");

  const client = new EventHubConsumerClient(CONSUMER_GROUP, CONNECTION_STRING);

  console.log("Connected to Event Hub. Listening for events...");

  const subscription = client.subscribe(
    {
      async processEvents(events, context) {
        if (!events || events.length === 0) return;

        for (const ev of events) {
          const data = ev.body;

          const sessionId = data.sessionId;
          const type = data.type;

          if (!sessionId || !type) continue;

          // ------------------------------
          // ACTIVE SESSION TRACKING
          // ------------------------------
          if (type === "page_exit") {
            // session ends → remove from map
            activeSessions.delete(sessionId);
          } else {
            // any other event → session is active
            activeSessions.set(sessionId, data);
          }

          // (optional) debug
          // console.log("Active:", activeSessions.size);
        }
      },

      async processError(err, context) {
        console.error("Error in EventHub:", context?.partitionId, err);
      }
    }
  );

  // graceful shutdown
  process.on("SIGINT", async () => {
    console.log("Stopping EventHub streaming...");
    await subscription.close();
    await client.close();
    process.exit(0);
  });
}

startConsumer().catch(err => {
  console.error("Fatal consumer error:", err);
  process.exit(1);
});
