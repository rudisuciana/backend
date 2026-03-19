import { describe, expect, it, vi } from 'vitest';
import { AuthService } from '../src/modules/auth/auth.service';

describe('AuthService Gmail restriction', () => {
  it('should reject manual registration for non-gmail email', async () => {
    const authRepository = {
      getUserByEmail: vi.fn(),
      getUserByUsername: vi.fn(),
      getUserByPhone: vi.fn(),
      createUser: vi.fn()
    };
    const redisClient = {
      set: vi.fn()
    };
    const authService = new AuthService(authRepository as never, redisClient as never);

    await expect(
      authService.registerManual({
        username: 'regularuser',
        email: 'user@yahoo.com',
        phone: '081234567890',
        password: 'Password123!'
      })
    ).rejects.toThrow('EMAIL_DOMAIN_NOT_ALLOWED');

    expect(authRepository.getUserByEmail).not.toHaveBeenCalled();
    expect(authRepository.createUser).not.toHaveBeenCalled();
    expect(redisClient.set).not.toHaveBeenCalled();
  });

  it('should reject google registration for non-gmail email', async () => {
    const authRepository = {
      getUserByEmail: vi.fn(),
      getUserByGoogleId: vi.fn(),
      createUser: vi.fn()
    };
    const redisClient = {};
    const authService = new AuthService(authRepository as never, redisClient as never);
    vi.spyOn(authService as never, 'verifyGoogleIdToken').mockResolvedValue({
      googleId: 'google-id-123',
      email: 'user@outlook.com',
      name: 'Outlook User'
    });

    await expect(
      authService.registerWithGoogle({
        idToken: 'valid-looking-id-token-that-is-long-enough'
      })
    ).rejects.toThrow('EMAIL_DOMAIN_NOT_ALLOWED');

    expect(authRepository.getUserByEmail).not.toHaveBeenCalled();
    expect(authRepository.createUser).not.toHaveBeenCalled();
  });
});
