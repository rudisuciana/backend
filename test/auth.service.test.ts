import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { env } from '../src/config/env';
import { AuthService } from '../src/modules/auth/auth.service';

describe('AuthService Gmail restriction', () => {
  let originalAllowedDomains: string[];

  beforeEach(() => {
    originalAllowedDomains = [...env.auth.allowedEmailDomains];
    env.auth.allowedEmailDomains = ['gmail.com'];
  });

  afterEach(() => {
    env.auth.allowedEmailDomains = originalAllowedDomains;
  });

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
      setRefreshTokenHash: vi.fn(),
      setRefreshTokenAndCreateSession: vi.fn(),
      createSession: vi.fn()
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
      multilogin: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
      mfaEnabled: false,
      mfaOtpHash: null,
      mfaOtpExpired: null,
      status: 'active'
    });

    expect(tokens.accessToken).toBeTypeOf('string');
    expect(tokens.refreshToken).toBeTypeOf('string');
    expect(authRepository.setRefreshTokenAndCreateSession).toHaveBeenCalledOnce();
    expect(authRepository.setRefreshTokenAndCreateSession.mock.calls[0][2]).toBeTypeOf('string');
    expect(redisClient.set).toHaveBeenCalledOnce();
    expect(redisClient.set.mock.calls[0][0]).toMatch(/^auth:access:9:/);
    expect(redisClient.set.mock.calls[0][2]).toBe('EX');
    expect(redisClient.set.mock.calls[0][3]).toBeGreaterThan(0);
  });

  it('should issue access token 15m and refresh token 7d by default', async () => {
    const authRepository = {
      setRefreshTokenHash: vi.fn(),
      setRefreshTokenAndCreateSession: vi.fn(),
      createSession: vi.fn()
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
      multilogin: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
      mfaEnabled: false,
      mfaOtpHash: null,
      mfaOtpExpired: null,
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

  it('should rotate refresh token when refreshing access token', async () => {
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
        multilogin: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
        mfaEnabled: false,
        mfaOtpHash: null,
        mfaOtpExpired: null,
        status: 'active'
      }),
      setRefreshTokenHash: vi.fn(),
      setRefreshTokenAndCreateSession: vi.fn(),
      createSession: vi.fn()
    };
    const redisClient = {
      set: vi.fn()
    };
    const authService = new AuthService(authRepository as never, redisClient as never);

    const refreshed = await authService.refreshToken(refreshToken);

    expect(refreshed.accessToken).toBeTypeOf('string');
    expect(refreshed.refreshToken).toBeTypeOf('string');
    expect(authRepository.setRefreshTokenAndCreateSession).toHaveBeenCalledOnce();
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
        multilogin: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
        mfaEnabled: false,
        mfaOtpHash: null,
        mfaOtpExpired: null,
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

  it('should revoke refresh session when reuse is detected', async () => {
    const userId = 15;
    const refreshToken = jwt.sign({}, env.auth.refreshTokenSecret, {
      subject: String(userId),
      expiresIn: env.auth.refreshTokenExpiresIn as jwt.SignOptions['expiresIn']
    });

    const authRepository = {
      getUserById: vi.fn().mockResolvedValue({
        id: userId,
        username: 'reuse-user',
        name: 'Reuse User',
        email: 'reuse@gmail.com',
        phone: '0812311111',
        apikey: 'apikey',
        passwordHash: 'hash',
        googleId: null,
        emailVerifiedAt: new Date().toISOString(),
        refreshTokenHash: await bcrypt.hash('different-token', 10),
        refreshTokenExpired: new Date(Date.now() + 60_000).toISOString(),
        multilogin: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
        mfaEnabled: false,
        mfaOtpHash: null,
        mfaOtpExpired: null,
        status: 'active'
      }),
      setRefreshTokenHash: vi.fn(),
      createSecurityLog: vi.fn()
    };
    const redisClient = {
      set: vi.fn()
    };
    const authService = new AuthService(authRepository as never, redisClient as never);

    await expect(authService.refreshToken(refreshToken)).rejects.toThrow('REFRESH_TOKEN_REUSE_DETECTED');
    expect(authRepository.setRefreshTokenHash).toHaveBeenCalledOnce();
    expect(authRepository.setRefreshTokenHash).toHaveBeenCalledWith(userId, null, null);
  });

  it('should clear refresh session on logout when refresh token is valid', async () => {
    const userId = 14;
    const refreshToken = jwt.sign({}, env.auth.refreshTokenSecret, {
      subject: String(userId),
      expiresIn: env.auth.refreshTokenExpiresIn as jwt.SignOptions['expiresIn']
    });
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    const authRepository = {
      getUserById: vi.fn().mockResolvedValue({
        id: userId,
        username: 'logout-user',
        name: 'Logout User',
        email: 'logout@gmail.com',
        phone: '0812300000',
        apikey: 'apikey',
        passwordHash: 'hash',
        googleId: null,
        emailVerifiedAt: new Date().toISOString(),
        refreshTokenHash,
        refreshTokenExpired: new Date(Date.now() + 60_000).toISOString(),
        multilogin: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
        mfaEnabled: false,
        mfaOtpHash: null,
        mfaOtpExpired: null,
        status: 'active'
      }),
      setRefreshTokenHash: vi.fn(),
      revokeActiveSessions: vi.fn(),
      createSecurityLog: vi.fn()
    };
    const redisClient = {
      set: vi.fn()
    };
    const authService = new AuthService(authRepository as never, redisClient as never);

    await authService.logout(refreshToken);

    expect(authRepository.setRefreshTokenHash).toHaveBeenCalledOnce();
    expect(authRepository.setRefreshTokenHash).toHaveBeenCalledWith(userId, null, null);
  });

  it('should reject login when account is locked', async () => {
    const authRepository = {
      getUserByEmail: vi.fn().mockResolvedValue({
        id: 31,
        username: 'locked',
        name: 'Locked User',
        email: 'locked@gmail.com',
        phone: '0800000001',
        apikey: 'apikey',
        passwordHash: await bcrypt.hash('Password123!', 10),
        googleId: null,
        emailVerifiedAt: new Date().toISOString(),
        refreshTokenHash: null,
        refreshTokenExpired: null,
        multilogin: true,
        failedLoginAttempts: 6,
        lockedUntil: new Date(Date.now() + 15 * 60_000).toISOString(),
        mfaEnabled: false,
        mfaOtpHash: null,
        mfaOtpExpired: null,
        status: 'active'
      }),
      getUserByUsername: vi.fn(),
      incrementFailedLoginAttempts: vi.fn(),
      clearFailedLoginAttempts: vi.fn(),
      createSecurityLog: vi.fn()
    };
    const authService = new AuthService(authRepository as never, {} as never);

    await expect(
      authService.login({
        identity: 'locked@gmail.com',
        password: 'Password123!'
      })
    ).rejects.toThrow('ACCOUNT_LOCKED');
  });

  it('should require MFA when mfa_enabled is true', async () => {
    const authRepository = {
      getUserByEmail: vi.fn().mockResolvedValue({
        id: 32,
        username: 'mfa',
        name: 'MFA User',
        email: 'mfa@gmail.com',
        phone: '0800000002',
        apikey: 'apikey',
        passwordHash: await bcrypt.hash('Password123!', 10),
        googleId: null,
        emailVerifiedAt: new Date().toISOString(),
        refreshTokenHash: null,
        refreshTokenExpired: null,
        multilogin: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
        mfaEnabled: true,
        mfaOtpHash: null,
        mfaOtpExpired: null,
        status: 'active'
      }),
      getUserByUsername: vi.fn(),
      clearFailedLoginAttempts: vi.fn(),
      storeMfaOtp: vi.fn(),
      createSecurityLog: vi.fn()
    };
    const redisClient = { set: vi.fn() };
    const authService = new AuthService(authRepository as never, redisClient as never);
    vi.spyOn(authService as never, 'sendOtpEmail').mockResolvedValue(undefined);

    await expect(
      authService.login({
        identity: 'mfa@gmail.com',
        password: 'Password123!'
      })
    ).rejects.toThrow('MFA_REQUIRED');
  });
});
