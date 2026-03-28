import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { requireApiKey } from '../src/middlewares/apiKey.middleware';

const createResponse = (): Response => {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  return { status, json } as unknown as Response;
};

describe('requireApiKey user whitelist ip', () => {
  it('should reject when request ip is not in whitelist', async () => {
    const middleware = requireApiKey('user', {
      getApiKeyAccessByApiKey: vi.fn().mockResolvedValue({ whitelistip: '127.0.0.1,10.0.0.1' })
    });
    const req = {
      ip: '192.168.1.20',
      header: vi.fn().mockReturnValue('user-secret-key')
    } as unknown as Request;
    const res = createResponse();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect((res.status as unknown as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(403);
  });

  it('should accept when request ip matches one of comma separated whitelist entries', async () => {
    const middleware = requireApiKey('user', {
      getApiKeyAccessByApiKey: vi.fn().mockResolvedValue({ whitelistip: '10.0.0.1, 127.0.0.1' })
    });
    const req = {
      ip: '127.0.0.1',
      header: vi.fn().mockReturnValue('user-secret-key')
    } as unknown as Request;
    const res = createResponse();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('should accept ipv4-mapped ipv6 when whitelist contains ipv4', async () => {
    const middleware = requireApiKey('user', {
      getApiKeyAccessByApiKey: vi.fn().mockResolvedValue({ whitelistip: '127.0.0.1' })
    });
    const req = {
      ip: '::ffff:127.0.0.1',
      header: vi.fn().mockReturnValue('user-secret-key')
    } as unknown as Request;
    const res = createResponse();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });
});
