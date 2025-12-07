import Redis from 'ioredis';

const globalForRedis = global as unknown as { redis: Redis };

export const redis =
    globalForRedis.redis ||
    new Redis(process.env.KV_REST_API_URL || '', {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
    });

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;
