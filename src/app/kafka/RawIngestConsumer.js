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

      // console.log("\n=== NEW EVENT RECEIVED ===");
      // console.log("Event:", event);

      // Build ClickHouse row
      const row = {
        timestamp: new Date(event.timestamp)
          .toISOString()
          .slice(0, 19)
          .replace("T", " "),
        eventType: event.type,
        visitorId: event.userId || "",
        sessionId: event.sessionId || "",
        url: event.url || "",
        action: event.action || ""
      };

      // Insert into ClickHouse
      try {
        await clickhouse.insert({
          table: "events",
          values: [row],
          format: "JSONEachRow"
        });
        // console.log("Inserted event → ClickHouse");
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
