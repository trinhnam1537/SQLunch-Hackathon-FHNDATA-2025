module.exports = {
  apps: [
    {
      name: "backend",
      script: "src/index.js",
      watch: true,                           // auto-restart when you edit backend files
      ignore_watch: [
        "node_modules",
        "logs",
        "src/app/kafka",                     // prevent consumer folder from restarting backend
        "*.log"
      ],
      instances: 1
    },

    {
      name: "session-consumer",
      script: "src/app/kafka/EndSessionConsumer.js",
      instances: 3,                          // 3 Kafka consumers
      exec_mode: "cluster",
      watch: false                           // ❌ DO NOT RESTART automatically
    }
  ]
};