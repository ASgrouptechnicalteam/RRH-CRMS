const Redis = require('ioredis');
const redis = new Redis('redis://localhost:6379', { maxRetriesPerRequest: 1, retryStrategy: () => null });
redis.ping().then(() => {
  console.log("PING: PONG");
  process.exit(0);
}).catch((err) => {
  console.log("REDIS CONNECTION FAILED:", err.message);
  process.exit(1);
});
