import { describe, expect, it, vi } from 'vitest';
import { RedisRateLimitStore } from '../src/middlewares/redisRateLimitStore';

describe('RedisRateLimitStore', () => {
  it('should increment and set expiry when ttl does not exist yet', async () => {
    const exec = vi.fn().mockResolvedValue([
      [null, 1],
      [null, -1]
    ]);
    const redisClient = {
      multi: vi.fn(() => ({
        incr: vi.fn().mockReturnThis(),
        pttl: vi.fn().mockReturnThis(),
        exec
      })),
      pexpire: vi.fn().mockResolvedValue(1),
      decr: vi.fn(),
      del: vi.fn()
    };
    const store = new RedisRateLimitStore(redisClient as never, 60_000, 'rate-limit:auth');

    const before = Date.now();
    const result = await store.increment('127.0.0.1');
    const after = Date.now();

    expect(result.totalHits).toBe(1);
    expect(result.resetTime.getTime()).toBeGreaterThanOrEqual(before + 59_000);
    expect(result.resetTime.getTime()).toBeLessThanOrEqual(after + 61_000);
    expect(redisClient.pexpire).toHaveBeenCalledOnce();
  });

  it('should return undefined from get when counter does not exist', async () => {
    const redisClient = {
      multi: vi.fn(() => ({
        get: vi.fn().mockReturnThis(),
        pttl: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([
          [null, null],
          [null, -2]
        ])
      })),
      pexpire: vi.fn(),
      decr: vi.fn(),
      del: vi.fn()
    };
    const store = new RedisRateLimitStore(redisClient as never, 60_000, 'rate-limit:user');

    const result = await store.get('127.0.0.1');

    expect(result).toBeUndefined();
  });

  it('should reset key by deleting prefixed redis key', async () => {
    const redisClient = {
      multi: vi.fn(),
      pexpire: vi.fn(),
      decr: vi.fn(),
      del: vi.fn().mockResolvedValue(1)
    };
    const store = new RedisRateLimitStore(redisClient as never, 60_000, 'rate-limit:user');

    await store.resetKey('abc');

    expect(redisClient.del).toHaveBeenCalledWith('rate-limit:user:abc');
  });
});
