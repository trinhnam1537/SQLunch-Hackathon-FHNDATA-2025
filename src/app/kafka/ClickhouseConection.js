const { createClient } = require("@clickhouse/client");

const clickhouse = createClient({
  url: "http://localhost:8123",
  username: "default",
  password: "",
  database: "analytics"
});

module.exports = { clickhouse };