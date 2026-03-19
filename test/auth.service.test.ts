import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { describe, expect, it, vi } from 'vitest';
import { env } from '../src/config/env';
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

  it('should store issued access token in redis with ttl', async () => {
    const authRepository = {
      setRefreshTokenHash: vi.fn()
    };
    const redisClient = {
      set: vi.fn()
    };
    const authService = new AuthService(authRepository as never, redisClient as never);
    const tokens = await Reflect.get(authService as object, 'issueAndStoreTokens').call(authService, {
      id: 9,
      username: 'tester',
      name: 'Tester',
      email: 'tester@gmail.com',
      phone: '0811111111',
      apikey: 'apikey',
      passwordHash: 'hash',
      googleId: null,
      emailVerifiedAt: new Date().toISOString(),
      refreshTokenHash: null,
      refreshTokenExpired: null,
      status: 'active'
    });

    expect(tokens.accessToken).toBeTypeOf('string');
    expect(tokens.refreshToken).toBeTypeOf('string');
    expect(authRepository.setRefreshTokenHash).toHaveBeenCalledOnce();
    expect(authRepository.setRefreshTokenHash.mock.calls[0][2]).toBeTypeOf('string');
    expect(redisClient.set).toHaveBeenCalledOnce();
    expect(redisClient.set.mock.calls[0][0]).toMatch(/^auth:access:9:/);
    expect(redisClient.set.mock.calls[0][2]).toBe('EX');
    expect(redisClient.set.mock.calls[0][3]).toBeGreaterThan(0);
  });

  it('should issue access token 15m and refresh token 7d by default', async () => {
    const authRepository = {
      setRefreshTokenHash: vi.fn()
    };
    const redisClient = {
      set: vi.fn()
    };
    const authService = new AuthService(authRepository as never, redisClient as never);
    const tokens = await Reflect.get(authService as object, 'issueAndStoreTokens').call(authService, {
      id: 10,
      username: 'tester2',
      name: 'Tester 2',
      email: 'tester2@gmail.com',
      phone: '0822222222',
      apikey: 'apikey2',
      passwordHash: 'hash',
      googleId: null,
      emailVerifiedAt: new Date().toISOString(),
      refreshTokenHash: null,
      refreshTokenExpired: null,
      status: 'active'
    });

    const accessPayload = jwt.decode(tokens.accessToken) as jwt.JwtPayload;
    const refreshPayload = jwt.decode(tokens.refreshToken) as jwt.JwtPayload;

    expect(accessPayload.exp).toBeDefined();
    expect(accessPayload.iat).toBeDefined();
    expect(refreshPayload.exp).toBeDefined();
    expect(refreshPayload.iat).toBeDefined();

    expect(accessPayload.exp! - accessPayload.iat!).toBe(15 * 60);
    expect(refreshPayload.exp! - refreshPayload.iat!).toBe(7 * 24 * 60 * 60);
  });

  it('should refresh only access token without issuing a new refresh token', async () => {
    const userId = 12;
    const refreshToken = jwt.sign({}, env.auth.refreshTokenSecret, {
      subject: String(userId),
      expiresIn: env.auth.refreshTokenExpiresIn as jwt.SignOptions['expiresIn']
    });
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const refreshTokenExpired = new Date(Date.now() + 60_000).toISOString();

    const authRepository = {
      getUserById: vi.fn().mockResolvedValue({
        id: userId,
        username: 'refresh-user',
        name: 'Refresh User',
        email: 'refresh@gmail.com',
        phone: '0800000000',
        apikey: 'apikey',
        passwordHash: 'hash',
        googleId: null,
        emailVerifiedAt: new Date().toISOString(),
        refreshTokenHash,
        refreshTokenExpired,
        status: 'active'
      }),
      setRefreshTokenHash: vi.fn()
    };
    const redisClient = {
      set: vi.fn()
    };
    const authService = new AuthService(authRepository as never, redisClient as never);

    const refreshed = await authService.refreshToken(refreshToken);

    expect(refreshed.accessToken).toBeTypeOf('string');
    expect((refreshed as Record<string, unknown>).refreshToken).toBeUndefined();
    expect(authRepository.setRefreshTokenHash).not.toHaveBeenCalled();
    expect(redisClient.set).toHaveBeenCalledOnce();
  });

  it('should reject refresh when stored refresh_token_expired is in the past', async () => {
    const userId = 13;
    const refreshToken = jwt.sign({}, env.auth.refreshTokenSecret, {
      subject: String(userId),
      expiresIn: env.auth.refreshTokenExpiresIn as jwt.SignOptions['expiresIn']
    });
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    const authRepository = {
      getUserById: vi.fn().mockResolvedValue({
        id: userId,
        username: 'expired-refresh-user',
        name: 'Expired Refresh User',
        email: 'expired.refresh@gmail.com',
        phone: '0812340000',
        apikey: 'apikey',
        passwordHash: 'hash',
        googleId: null,
        emailVerifiedAt: new Date().toISOString(),
        refreshTokenHash,
        refreshTokenExpired: new Date(Date.now() - 60_000).toISOString(),
        status: 'active'
      }),
      setRefreshTokenHash: vi.fn()
    };
    const redisClient = {
      set: vi.fn()
    };
    const authService = new AuthService(authRepository as never, redisClient as never);

    await expect(authService.refreshToken(refreshToken)).rejects.toThrow('INVALID_REFRESH_TOKEN');
  });
});
