// // src/app/kafka/consumer.js
// const { Kafka } = require("kafkajs");

// // Connect to all 3 brokers
// const kafka = new Kafka({
//   brokers: ["localhost:9092", "localhost:9094", "localhost:9095"]
// });

// const consumer = kafka.consumer({ groupId: "web-events-group" });

// // Temporary in-memory session store
// const sessions = {}; 
// const dwellStats = { stayed5s: 0, total: 0 };

// async function startConsumer() {
//   await consumer.connect();
//   console.log("Kafka consumer connected");

//   await consumer.subscribe({ topic: "web-events", fromBeginning: true });

//   await consumer.run({
//     eachMessage: async ({ message }) => {
//       const event = JSON.parse(message.value.toString());

//       const { sessionId, type, timestamp, url } = event;

//       if (!sessions[sessionId]) {
//         sessions[sessionId] = {
//           pageViewTime: null,
//           exitTime: null
//         };
//       }

//       // Handle events
//       if (type === "page_view") {
//         sessions[sessionId].pageViewTime = timestamp;
//       }

//       if (type === "page_exit") {
//         sessions[sessionId].exitTime = timestamp;

//         const session = sessions[sessionId];

//         if (session.pageViewTime && session.exitTime) {
//           const dwell = session.exitTime - session.pageViewTime;

//           dwellStats.total++;

//           if (dwell >= 5000) dwellStats.stayed5s++;

//           console.log("\n=== SESSION COMPLETE ===");
//           console.log("Dwell time:", dwell, "ms");
//           console.log("Stayed >= 5s:", dwell >= 5000);
//           console.log("Current %:", (dwellStats.stayed5s / dwellStats.total * 100).toFixed(2), "%");

//           // Remove the session from memory
//           delete sessions[sessionId];
//         }
//       }
//     }
//   });
// }

// module.exports = { startConsumer };



const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  brokers: ["localhost:9092", "localhost:9094", "localhost:9095"]
});

const consumer = kafka.consumer({ groupId: "web-events-debug" });

async function startConsumer() {
  await consumer.connect();
  console.log("Kafka consumer connected");

  await consumer.subscribe({ topic: "web-events", fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const raw = message.value.toString();
      const event = JSON.parse(raw);

      console.log("\n=== NEW EVENT RECEIVED ===");
      console.log("Topic:", topic);
      console.log("Partition:", partition);
      console.log("Offset:", message.offset);
      console.log("Event:", event);
    }
  });
}

module.exports = { startConsumer };