import type { IncrementResponse, Store } from 'express-rate-limit';
import type Redis from 'ioredis';

type RedisExecResult = [Error | null, unknown][];

export class RedisRateLimitStore implements Store {
  localKeys = false;

  constructor(
    private readonly redisClient: Redis,
    private readonly windowMs: number,
    private readonly keyPrefix: string
  ) {}

  private keyFor(key: string): string {
    return `${this.keyPrefix}:${key}`;
  }

  private asExecResult(result: unknown): RedisExecResult {
    if (!Array.isArray(result)) {
      throw new Error('Failed to execute Redis rate limit pipeline');
    }

    return result as RedisExecResult;
  }

  async get(key: string): Promise<IncrementResponse | undefined> {
    const redisKey = this.keyFor(key);
    const result = await this.redisClient.multi().get(redisKey).pttl(redisKey).exec();
    const entries = this.asExecResult(result);

    const getError = entries[0]?.[0];
    const ttlError = entries[1]?.[0];
    if (getError || ttlError) {
      throw getError ?? ttlError ?? new Error('Failed to retrieve rate limit data from Redis');
    }

    const rawHits = entries[0]?.[1];
    const rawTtl = entries[1]?.[1];
    const totalHits = rawHits === null ? 0 : Number(rawHits);
    const ttlMs = Number(rawTtl);

    if (!Number.isFinite(totalHits) || totalHits <= 0) {
      return undefined;
    }

    const resetTime =
      Number.isFinite(ttlMs) && ttlMs > 0 ? new Date(Date.now() + ttlMs) : new Date(Date.now());

    return { totalHits, resetTime };
  }

  async increment(key: string): Promise<IncrementResponse> {
    const redisKey = this.keyFor(key);
    const result = await this.redisClient.multi().incr(redisKey).pttl(redisKey).exec();
    const entries = this.asExecResult(result);

    const incrError = entries[0]?.[0];
    const ttlError = entries[1]?.[0];
    if (incrError || ttlError) {
      throw incrError ?? ttlError ?? new Error('Failed to increment rate limit data in Redis');
    }

    const totalHits = Number(entries[0]?.[1]);
    let ttlMs = Number(entries[1]?.[1]);

    if (!Number.isFinite(totalHits) || totalHits < 1) {
      throw new Error('Redis returned invalid hit count for rate limiter');
    }

    if (!Number.isFinite(ttlMs) || ttlMs <= 0) {
      await this.redisClient.pexpire(redisKey, this.windowMs);
      ttlMs = this.windowMs;
    }

    return {
      totalHits,
      resetTime: new Date(Date.now() + ttlMs)
    };
  }

  async decrement(key: string): Promise<void> {
    const redisKey = this.keyFor(key);
    await this.redisClient.decr(redisKey);
  }

  async resetKey(key: string): Promise<void> {
    const redisKey = this.keyFor(key);
    await this.redisClient.del(redisKey);
  }
}
