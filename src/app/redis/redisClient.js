const redis = require("redis");

let client = null;

async function getRedis() {
  if (!client) {
    client = redis.createClient();
    await client.connect();
    console.log("Redis connected");
  }
  return client;
}

module.exports = getRedis;