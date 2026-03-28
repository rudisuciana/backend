import Redis from 'ioredis';
import { env } from '../config/env';

let redisClient: Redis | null = null;

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    redisClient = new Redis({
      host: env.redis.host,
      port: env.redis.port,
      password: env.redis.password,
      lazyConnect: true,
      maxRetriesPerRequest: 1
    });
  }

  return redisClient;
};
