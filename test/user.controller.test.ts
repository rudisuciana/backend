import { describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { UserController } from '../src/modules/user/user.controller';

const createResponse = (): Response => {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  return { status, json } as unknown as Response;
};

describe('UserController', () => {
  it('should reject profile request without x-api-key header', async () => {
    const userService = {
      getProfileByApiKey: vi.fn()
    };
    const controller = new UserController(userService as never);
    const req = { header: vi.fn().mockReturnValue(undefined) } as unknown as Request;
    const res = createResponse();

    await controller.getProfile(req, res);

    expect(userService.getProfileByApiKey).not.toHaveBeenCalled();
    expect((res.status as unknown as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(401);
  });

  it('should return profile by x-api-key', async () => {
    const profile = {
      name: 'Demo User',
      email: 'demo@example.com',
      balance: 500000,
      status: 'active',
      avatar: null
    };
    const userService = {
      getProfileByApiKey: vi.fn().mockResolvedValue(profile)
    };
    const controller = new UserController(userService as never);
    const req = { header: vi.fn().mockReturnValue('user-secret-key') } as unknown as Request;
    const res = createResponse();

    await controller.getProfile(req, res);

    expect(userService.getProfileByApiKey).toHaveBeenCalledWith('user-secret-key');
    expect((res.json as unknown as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith({
      success: true,
      data: profile
    });
  });
});
