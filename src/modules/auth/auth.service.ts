import { randomInt, randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type Redis from 'ioredis';
import jwt from 'jsonwebtoken';
import { google } from 'googleapis';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { AuthRepository } from './auth.repository';
import type { AuthTokens, AuthUser } from './auth.types';

interface RegisterInput {
  username: string;
  email: string;
  phone: string;
  password: string;
}

interface LoginInput {
  identity: string;
  password: string;
  singleSession?: boolean;
}

interface VerifyOtpInput {
  email: string;
  otp: string;
}

interface ForgotPasswordInput {
  email: string;
}

interface ResetPasswordInput {
  email: string;
  otp: string;
  newPassword: string;
}

interface GoogleAuthInput {
  idToken: string;
  phone?: string;
}

type TokenType = 'access' | 'refresh';

const parseDurationToSeconds = (value: string): number => {
  const raw = value.trim().toLowerCase();
  if (!raw) {
    return 0;
  }

  const asNumber = Number(raw);
  if (Number.isFinite(asNumber)) {
    return Math.max(0, Math.floor(asNumber));
  }

  const match = raw.match(/^(\d+)([smhd])$/);
  if (!match) {
    return 0;
  }

  const amount = Number(match[1]);
  const unit = match[2];
  const multiplier = unit === 's' ? 1 : unit === 'm' ? 60 : unit === 'h' ? 3600 : 86400;
  return amount * multiplier;
};

const isAllowedGmail = (email: string): boolean => email.toLowerCase().endsWith('@gmail.com');

export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly redisClient: Redis
  ) {}

  async registerManual(input: RegisterInput): Promise<{ userId: number; email: string }> {
    if (!isAllowedGmail(input.email)) {
      throw new Error('EMAIL_DOMAIN_NOT_ALLOWED');
    }

    const existingEmail = await this.authRepository.getUserByEmail(input.email);
    if (existingEmail) {
      throw new Error('EMAIL_ALREADY_USED');
    }

    const existingUsername = await this.authRepository.getUserByUsername(input.username);
    if (existingUsername) {
      throw new Error('USERNAME_ALREADY_USED');
    }

    const existingPhone = await this.authRepository.getUserByPhone(input.phone);
    if (existingPhone) {
      throw new Error('PHONE_ALREADY_USED');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.authRepository.createUser({
      username: input.username,
      name: input.username,
      email: input.email,
      phone: input.phone,
      passwordHash,
      emailVerified: false
    });

    const otp = this.generateOtp();
    await this.redisClient.set(this.registrationOtpKey(input.email), otp, 'EX', env.auth.otpTtlSeconds);
    await this.sendOtpEmail(input.email, otp, 'Verifikasi OTP Registrasi');

    return { userId: user.id, email: user.email };
  }

  async verifyRegisterOtp(input: VerifyOtpInput): Promise<void> {
    const cachedOtp = await this.redisClient.get(this.registrationOtpKey(input.email));
    if (!cachedOtp || cachedOtp !== input.otp) {
      throw new Error('INVALID_OTP');
    }

    const user = await this.authRepository.getUserByEmail(input.email);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    await this.authRepository.setUserEmailVerified(user.id);
    await this.redisClient.del(this.registrationOtpKey(input.email));
  }

  async login(input: LoginInput): Promise<AuthTokens> {
    const user =
      input.identity.includes('@')
        ? await this.authRepository.getUserByEmail(input.identity)
        : await this.authRepository.getUserByUsername(input.identity);

    if (!user || !user.passwordHash) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const lockedUntil = user.lockedUntil ? new Date(user.lockedUntil).getTime() : Number.NaN;
    if (Number.isFinite(lockedUntil) && lockedUntil > Date.now()) {
      logger.warn({ userId: user.id }, 'Security event: login blocked due to account lockout');
      await this.authRepository.createSecurityLog(user.id, 'login_locked');
      throw new Error('ACCOUNT_LOCKED');
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      await this.authRepository.incrementFailedLoginAttempts(user.id);
      logger.warn({ userId: user.id }, 'Security event: failed login attempt');
      await this.authRepository.createSecurityLog(user.id, 'login_failed');
      throw new Error('INVALID_CREDENTIALS');
    }

    await this.authRepository.clearFailedLoginAttempts(user.id);

    if (!user.emailVerifiedAt) {
      throw new Error('EMAIL_NOT_VERIFIED');
    }

    if (user.mfaEnabled) {
      const otp = this.generateOtp();
      const otpHash = await bcrypt.hash(otp, 10);
      const expiredAt = this.getOtpExpiredAtIso();
      await this.authRepository.storeMfaOtp(user.id, otpHash, expiredAt);
      await this.sendOtpEmail(user.email, otp, 'OTP MFA Login');
      logger.info({ userId: user.id }, 'Security event: MFA challenge issued');
      await this.authRepository.createSecurityLog(user.id, 'mfa_challenge_issued');
      throw new Error('MFA_REQUIRED');
    }

    if (input.singleSession === true || user.multilogin === false) {
      await this.authRepository.clearRefreshSessions(user.id);
      await this.authRepository.createSecurityLog(user.id, 'session_single_enforced');
    }

    return this.issueAndStoreTokens(user);
  }

  async verifyMfaLogin(input: VerifyOtpInput): Promise<AuthTokens> {
    const user = await this.authRepository.getUserByEmail(input.email);
    if (!user || !user.mfaEnabled || !user.mfaOtpHash || !user.mfaOtpExpired) {
      throw new Error('INVALID_OTP');
    }

    const otpExpiredAt = new Date(user.mfaOtpExpired).getTime();
    if (!Number.isFinite(otpExpiredAt) || otpExpiredAt <= Date.now()) {
      await this.authRepository.clearMfaOtp(user.id);
      throw new Error('INVALID_OTP');
    }

    const isMatch = await bcrypt.compare(input.otp, user.mfaOtpHash);
    if (!isMatch) {
      throw new Error('INVALID_OTP');
    }

    await this.authRepository.clearMfaOtp(user.id);
    if (!user.multilogin) {
      await this.authRepository.clearRefreshSessions(user.id);
    }
    await this.authRepository.createSecurityLog(user.id, 'mfa_verified');

    return this.issueAndStoreTokens(user);
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(refreshToken, this.resolveSecretForToken(refreshToken, 'refresh')) as jwt.JwtPayload;
    } catch {
      throw new Error('INVALID_REFRESH_TOKEN');
    }

    const userId = Number(payload.sub);
    if (!userId) {
      throw new Error('INVALID_REFRESH_TOKEN');
    }

    const user = await this.authRepository.getUserById(userId);
    if (!user || !user.refreshTokenHash) {
      throw new Error('INVALID_REFRESH_TOKEN');
    }

    const refreshTokenExpiredAt = user.refreshTokenExpired
      ? new Date(user.refreshTokenExpired).getTime()
      : Number.NaN;
    if (!Number.isFinite(refreshTokenExpiredAt) || refreshTokenExpiredAt <= Date.now()) {
      throw new Error('INVALID_REFRESH_TOKEN');
    }

    const isTokenMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isTokenMatch) {
      await this.authRepository.setRefreshTokenHash(user.id, null, null);
      logger.warn({ userId: user.id }, 'Security event: refresh token reuse detected');
      await this.authRepository.createSecurityLog(user.id, 'refresh_reuse_detected');
      throw new Error('REFRESH_TOKEN_REUSE_DETECTED');
    }

    return this.issueAndStoreTokens(user);
  }

  async logout(refreshToken: string): Promise<void> {
    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(refreshToken, this.resolveSecretForToken(refreshToken, 'refresh')) as jwt.JwtPayload;
    } catch {
      throw new Error('INVALID_REFRESH_TOKEN');
    }

    const userId = Number(payload.sub);
    if (!userId) {
      throw new Error('INVALID_REFRESH_TOKEN');
    }

    const user = await this.authRepository.getUserById(userId);
    if (!user || !user.refreshTokenHash) {
      throw new Error('INVALID_REFRESH_TOKEN');
    }

    const isTokenMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isTokenMatch) {
      throw new Error('INVALID_REFRESH_TOKEN');
    }

    await this.authRepository.setRefreshTokenHash(user.id, null, null);
    await this.authRepository.revokeActiveSessions(user.id);
    await this.authRepository.createSecurityLog(user.id, 'logout');
  }

  async forgotPassword(input: ForgotPasswordInput): Promise<void> {
    const user = await this.authRepository.getUserByEmail(input.email);
    if (!user) {
      return;
    }

    const otp = this.generateOtp();
    await this.redisClient.set(this.forgotOtpKey(input.email), otp, 'EX', env.auth.otpTtlSeconds);
    await this.sendOtpEmail(input.email, otp, 'OTP Reset Password');
  }

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const cachedOtp = await this.redisClient.get(this.forgotOtpKey(input.email));
    if (!cachedOtp || cachedOtp !== input.otp) {
      throw new Error('INVALID_OTP');
    }

    const user = await this.authRepository.getUserByEmail(input.email);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    const passwordHash = await bcrypt.hash(input.newPassword, 10);
    await this.authRepository.updatePasswordHash(user.id, passwordHash);
    await this.authRepository.setRefreshTokenHash(user.id, null, null);
    await this.redisClient.del(this.forgotOtpKey(input.email));
  }

  async registerWithGoogle(input: GoogleAuthInput): Promise<AuthTokens> {
    const profile = await this.verifyGoogleIdToken(input.idToken);
    if (!isAllowedGmail(profile.email)) {
      throw new Error('EMAIL_DOMAIN_NOT_ALLOWED');
    }

    const existingByEmail = await this.authRepository.getUserByEmail(profile.email);
    if (existingByEmail) {
      throw new Error('EMAIL_ALREADY_USED');
    }

    const existingByGoogleId = await this.authRepository.getUserByGoogleId(profile.googleId);
    if (existingByGoogleId) {
      throw new Error('GOOGLE_ACCOUNT_ALREADY_USED');
    }

    const user = await this.authRepository.createUser({
      username: this.generateGoogleUsername(profile.email),
      name: profile.name,
      email: profile.email,
      phone: input.phone ?? this.generateGooglePhone(),
      passwordHash: null,
      googleId: profile.googleId,
      emailVerified: true
    });

    return this.issueAndStoreTokens(user);
  }

  async loginWithGoogle(input: GoogleAuthInput): Promise<AuthTokens> {
    const profile = await this.verifyGoogleIdToken(input.idToken);
    const byGoogleId = await this.authRepository.getUserByGoogleId(profile.googleId);
    if (byGoogleId) {
      return this.issueAndStoreTokens(byGoogleId);
    }

    const byEmail = await this.authRepository.getUserByEmail(profile.email);
    if (!byEmail) {
      throw new Error('GOOGLE_ACCOUNT_NOT_REGISTERED');
    }

    await this.authRepository.linkGoogleId(byEmail.id, profile.googleId);
    const refreshedUser = await this.authRepository.getUserById(byEmail.id);
    if (!refreshedUser) {
      throw new Error('USER_NOT_FOUND');
    }

    return this.issueAndStoreTokens(refreshedUser);
  }

  private async issueAndStoreTokens(user: AuthUser): Promise<AuthTokens> {
    const tokenId = randomUUID();
    const accessToken = await this.issueAndStoreAccessToken(user, tokenId);

    const refreshToken = jwt.sign({}, env.auth.refreshTokenSecret, {
      subject: String(user.id),
      expiresIn: env.auth.refreshTokenExpiresIn as jwt.SignOptions['expiresIn'],
      keyid: env.auth.refreshTokenKid
    });

    const refreshHash = await bcrypt.hash(refreshToken, 10);
    const refreshPayload = jwt.decode(refreshToken) as jwt.JwtPayload;
    const refreshTokenExpired = refreshPayload.exp
      ? new Date(refreshPayload.exp * 1000).toISOString()
      : null;
    await this.authRepository.setRefreshTokenHash(user.id, refreshHash, refreshTokenExpired);
    await this.authRepository.createSession(user.id, refreshHash, refreshTokenExpired);

    return { accessToken, refreshToken };
  }

  private async issueAndStoreAccessToken(user: AuthUser, tokenId: string = randomUUID()): Promise<string> {
    const accessToken = jwt.sign(
      { email: user.email, username: user.username, jti: tokenId },
      env.auth.accessTokenSecret,
      {
        subject: String(user.id),
        expiresIn: env.auth.accessTokenExpiresIn as jwt.SignOptions['expiresIn'],
        keyid: env.auth.accessTokenKid
      }
    );

    const accessTtlSeconds = parseDurationToSeconds(env.auth.accessTokenExpiresIn);
    if (accessTtlSeconds > 0) {
      await this.redisClient.set(`auth:access:${user.id}:${tokenId}`, accessToken, 'EX', accessTtlSeconds);
    }

    return accessToken;
  }

  private generateOtp(): string {
    return String(randomInt(0, 1000000)).padStart(6, '0');
  }

  private getOtpExpiredAtIso(): string {
    return new Date(Date.now() + env.auth.otpTtlSeconds * 1000).toISOString();
  }

  private registrationOtpKey(email: string): string {
    return `auth:otp:register:${email.toLowerCase()}`;
  }

  private forgotOtpKey(email: string): string {
    return `auth:otp:forgot:${email.toLowerCase()}`;
  }

  private async sendOtpEmail(to: string, otp: string, subject: string): Promise<void> {
    if (
      !env.google.clientId ||
      !env.google.clientSecret ||
      !env.google.redirectUri ||
      !env.google.oauthRefreshToken ||
      !env.google.senderEmail
    ) {
      logger.warn({ to }, 'Google email config is incomplete, OTP email was not sent');
      return;
    }

    const oauthClient = new google.auth.OAuth2(
      env.google.clientId,
      env.google.clientSecret,
      env.google.redirectUri
    );
    oauthClient.setCredentials({ refresh_token: env.google.oauthRefreshToken });

    const gmail = google.gmail({ version: 'v1', auth: oauthClient });
    const rawMessage = this.toBase64Url(
      [
        `From: PPOB Blueprint <${env.google.senderEmail}>`,
        `To: ${to}`,
        `Subject: ${subject}`,
        'Content-Type: text/plain; charset="UTF-8"',
        '',
        `Kode OTP Anda: ${otp}. Berlaku selama ${env.auth.otpTtlSeconds} detik.`
      ].join('\r\n')
    );

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: rawMessage }
    });
  }

  private async verifyGoogleIdToken(idToken: string): Promise<{
    googleId: string;
    email: string;
    name: string;
  }> {
    if (!env.google.clientId) {
      throw new Error('GOOGLE_AUTH_NOT_CONFIGURED');
    }

    const oauthClient = new google.auth.OAuth2(env.google.clientId);
    const ticket = await oauthClient.verifyIdToken({
      idToken,
      audience: env.google.clientId
    });
    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email) {
      throw new Error('INVALID_GOOGLE_TOKEN');
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name ?? payload.email.split('@')[0]
    };
  }

  private generateGoogleUsername(email: string): string {
    const local = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    return `${local.slice(0, 20)}_${randomUUID().slice(0, 6)}`;
  }

  private generateGooglePhone(): string {
    return `g${Date.now().toString().slice(-8)}${randomInt(10, 99)}`;
  }

  private toBase64Url(value: string): string {
    return Buffer.from(value)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  private resolveSecretForToken(token: string, tokenType: TokenType): string {
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || typeof decoded !== 'object') {
      return tokenType === 'access' ? env.auth.accessTokenSecret : env.auth.refreshTokenSecret;
    }

    const kid = (decoded.header as jwt.JwtHeader | undefined)?.kid;
    if (!kid) {
      return tokenType === 'access' ? env.auth.accessTokenSecret : env.auth.refreshTokenSecret;
    }

    if (tokenType === 'access') {
      return env.auth.accessTokenSecrets[kid] ?? env.auth.accessTokenSecret;
    }

    return env.auth.refreshTokenSecrets[kid] ?? env.auth.refreshTokenSecret;
  }
}
