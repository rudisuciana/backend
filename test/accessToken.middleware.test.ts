import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';
import { requireAccessToken } from '../src/middlewares/accessToken.middleware';

const createResponse = (): Response => {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  return { status, json } as unknown as Response;
};

describe('requireAccessToken', () => {
  it('should reject when authorization header is missing', async () => {
    const middleware = requireAccessToken({
      redisClient: { get: vi.fn() } as never
    });
    const req = {
      header: vi.fn().mockReturnValue(undefined)
    } as unknown as Request;
    const res = createResponse();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect((res.status as unknown as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(401);
  });

  it('should reject when token is not in redis', async () => {
    const payload = { sub: '1', jti: 'token-id' };
    const token = jwt.sign(payload, env.auth.accessTokenSecret, { expiresIn: '15m' });
    const middleware = requireAccessToken({
      redisClient: { get: vi.fn().mockResolvedValue(null) } as never
    });
    const req = {
      header: vi.fn().mockReturnValue(`Bearer ${token}`)
    } as unknown as Request;
    const res = createResponse();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect((res.status as unknown as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(401);
  });

  it('should accept when valid bearer token exists in redis', async () => {
    const payload = { sub: '2', jti: 'token-ok' };
    const token = jwt.sign(payload, env.auth.accessTokenSecret, { expiresIn: '15m' });
    const middleware = requireAccessToken({
      redisClient: { get: vi.fn().mockResolvedValue(token) } as never
    });
    const req = {
      header: vi.fn().mockReturnValue(`Bearer ${token}`)
    } as unknown as Request;
    const res = createResponse();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.authUserId).toBe(2);
  });
});

