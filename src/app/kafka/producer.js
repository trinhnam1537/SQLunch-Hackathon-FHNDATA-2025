// we use this file to make producer send data to kafka broker

// app/kafka/producer.js
const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  brokers: ["localhost:9092", "localhost:9094", "localhost:9095"]
});

const producer = kafka.producer();

async function initProducer() {
  await producer.connect();
  console.log("💀💀💀💀💀💀💀💀💀💀💀💀💀💀💀💀💀💀💀💀Kafka producer connected💀💀💀💀💀💀💀💀💀💀💀💀💀💀💀💀💀💀💀💀");
}

module.exports = { producer, initProducer };
