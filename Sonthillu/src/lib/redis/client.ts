import Redis from 'ioredis';

// Shared instance to avoid connection leaks in development
let redisClient: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;

  const url = process.env.REDIS_URL;
  if (!url) {
    return null; // Signals that Redis is not configured
  }

  try {
    redisClient = new Redis(url, {
      maxRetriesPerRequest: 1, // Don't hang indefinitely
      retryStrategy(times) {
        if (times > 2) {
          return null; // Stop retrying after 2 attempts
        }
        return Math.min(times * 100, 1000); // Backoff
      },
    });

    redisClient.on('error', (err) => {
      // Catch error to prevent unhandled rejection crashes
      console.warn('[Redis] Connection error:', err.message);
    });

    return redisClient;
  } catch (error) {
    console.warn('[Redis] Failed to initialize client:', error);
    return null;
  }
}
