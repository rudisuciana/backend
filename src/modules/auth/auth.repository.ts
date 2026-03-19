import { randomUUID } from 'node:crypto';
import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import type { AuthUser } from './auth.types';

const ACCOUNT_LOCK_THRESHOLD = 5;
const ACCOUNT_LOCK_DURATION_MINUTES = 15;

interface AuthUserRow extends RowDataPacket {
  id: number;
  username: string;
  name: string;
  email: string;
  phone: string;
  apikey: string;
  password_hash: string | null;
  google_id: string | null;
  email_verified_at: string | null;
  refresh_token_hash: string | null;
  refresh_token_expired: string | null;
  multilogin: number;
  failed_login_attempts: number;
  locked_until: string | null;
  mfa_enabled: number;
  mfa_otp_hash: string | null;
  mfa_otp_expired: string | null;
  status: string;
}

interface CreateUserInput {
  username: string;
  email: string;
  phone: string;
  name: string;
  passwordHash: string | null;
  googleId?: string | null;
  emailVerified: boolean;
}

const authUserSelectSql = `SELECT id, username, name, email, phone, apikey, password_hash, google_id, email_verified_at, refresh_token_hash, refresh_token_expired, multilogin, failed_login_attempts, locked_until, mfa_enabled, mfa_otp_hash, mfa_otp_expired, status
 FROM users`;

const toAuthUser = (row: AuthUserRow): AuthUser => ({
  id: row.id,
  username: row.username,
  name: row.name,
  email: row.email,
  phone: row.phone,
  apikey: row.apikey,
  passwordHash: row.password_hash,
  googleId: row.google_id,
  emailVerifiedAt: row.email_verified_at,
  refreshTokenHash: row.refresh_token_hash,
  refreshTokenExpired: row.refresh_token_expired,
  multilogin: Boolean(row.multilogin),
  failedLoginAttempts: row.failed_login_attempts ?? 0,
  lockedUntil: row.locked_until,
  mfaEnabled: Boolean(row.mfa_enabled),
  mfaOtpHash: row.mfa_otp_hash,
  mfaOtpExpired: row.mfa_otp_expired,
  status: row.status
});

export class AuthRepository {
  constructor(private readonly mysqlPool: Pool) {}

  async createUser(input: CreateUserInput): Promise<AuthUser> {
    const apikey = randomUUID();
    const [result] = await this.mysqlPool.execute<ResultSetHeader>(
      `INSERT INTO users (username, name, email, phone, apikey, password_hash, google_id, email_verified_at, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        input.username,
        input.name,
        input.email,
        input.phone,
        apikey,
        input.passwordHash,
        input.googleId ?? null,
        input.emailVerified ? new Date() : null
      ]
    );

    return this.getUserById(Number(result.insertId)) as Promise<AuthUser>;
  }

  async getUserById(id: number): Promise<AuthUser | null> {
    const [rows] = await this.mysqlPool.query<AuthUserRow[]>(
      `${authUserSelectSql}
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    if (!rows.length) {
      return null;
    }

    return toAuthUser(rows[0]);
  }

  async getUserByEmail(email: string): Promise<AuthUser | null> {
    const [rows] = await this.mysqlPool.query<AuthUserRow[]>(
      `${authUserSelectSql}
       WHERE email = ?
       LIMIT 1`,
      [email]
    );

    if (!rows.length) {
      return null;
    }

    return toAuthUser(rows[0]);
  }

  async getUserByUsername(username: string): Promise<AuthUser | null> {
    const [rows] = await this.mysqlPool.query<AuthUserRow[]>(
      `${authUserSelectSql}
       WHERE username = ?
       LIMIT 1`,
      [username]
    );

    if (!rows.length) {
      return null;
    }

    return toAuthUser(rows[0]);
  }

  async getUserByGoogleId(googleId: string): Promise<AuthUser | null> {
    const [rows] = await this.mysqlPool.query<AuthUserRow[]>(
      `${authUserSelectSql}
       WHERE google_id = ?
       LIMIT 1`,
      [googleId]
    );

    if (!rows.length) {
      return null;
    }

    return toAuthUser(rows[0]);
  }

  async getUserByPhone(phone: string): Promise<AuthUser | null> {
    const [rows] = await this.mysqlPool.query<AuthUserRow[]>(
      `${authUserSelectSql}
       WHERE phone = ?
       LIMIT 1`,
      [phone]
    );

    if (!rows.length) {
      return null;
    }

    return toAuthUser(rows[0]);
  }

  async setUserEmailVerified(userId: number): Promise<void> {
    await this.mysqlPool.execute(
      `UPDATE users
       SET email_verified_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [userId]
    );
  }

  async setRefreshTokenHash(
    userId: number,
    refreshTokenHash: string | null,
    refreshTokenExpired: string | null = null
  ): Promise<void> {
    await this.mysqlPool.execute(
      `UPDATE users
       SET refresh_token_hash = ?, refresh_token_expired = ?
       WHERE id = ?`,
      [refreshTokenHash, refreshTokenExpired, userId]
    );
  }

  async setMultilogin(userId: number, multilogin: boolean): Promise<void> {
    await this.mysqlPool.execute(
      `UPDATE users
       SET multilogin = ?
       WHERE id = ?`,
      [multilogin ? 1 : 0, userId]
    );
  }

  async clearRefreshSessions(userId: number): Promise<void> {
    await this.setRefreshTokenHash(userId, null, null);
    await this.revokeActiveSessions(userId);
  }

  async incrementFailedLoginAttempts(userId: number): Promise<void> {
    await this.mysqlPool.execute(
      `UPDATE users
       SET failed_login_attempts = failed_login_attempts + 1,
           locked_until = CASE
             WHEN failed_login_attempts + 1 >= ? THEN DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? MINUTE)
             ELSE locked_until
           END
       WHERE id = ?`,
      [ACCOUNT_LOCK_THRESHOLD, ACCOUNT_LOCK_DURATION_MINUTES, userId]
    );
  }

  async clearFailedLoginAttempts(userId: number): Promise<void> {
    await this.mysqlPool.execute(
      `UPDATE users
       SET failed_login_attempts = 0, locked_until = NULL
       WHERE id = ?`,
      [userId]
    );
  }

  async storeMfaOtp(userId: number, otpHash: string, expiredAtIso: string): Promise<void> {
    await this.mysqlPool.execute(
      `UPDATE users
       SET mfa_otp_hash = ?, mfa_otp_expired = ?
       WHERE id = ?`,
      [otpHash, expiredAtIso, userId]
    );
  }

  async clearMfaOtp(userId: number): Promise<void> {
    await this.mysqlPool.execute(
      `UPDATE users
       SET mfa_otp_hash = NULL, mfa_otp_expired = NULL
       WHERE id = ?`,
      [userId]
    );
  }

  async createSession(
    userId: number,
    refreshTokenHash: string,
    refreshTokenExpired: string | null
  ): Promise<void> {
    if (!refreshTokenExpired) {
      return;
    }

    await this.mysqlPool.execute(
      `INSERT INTO user_sessions (user_id, refresh_token_hash, refresh_token_expired)
       VALUES (?, ?, ?)`,
      [userId, refreshTokenHash, refreshTokenExpired]
    );
  }

  async revokeActiveSessions(userId: number): Promise<void> {
    await this.mysqlPool.execute(
      `UPDATE user_sessions
       SET revoked_at = CURRENT_TIMESTAMP
       WHERE user_id = ? AND revoked_at IS NULL`,
      [userId]
    );
  }

  async createSecurityLog(userId: number | null, event: string, metadata?: string): Promise<void> {
    await this.mysqlPool.execute(
      `INSERT INTO auth_security_logs (user_id, event, metadata)
       VALUES (?, ?, ?)`,
      [userId, event, metadata ?? null]
    );
  }

  async updatePasswordHash(userId: number, passwordHash: string): Promise<void> {
    await this.mysqlPool.execute(
      `UPDATE users
       SET password_hash = ?
       WHERE id = ?`,
      [passwordHash, userId]
    );
  }

  async linkGoogleId(userId: number, googleId: string): Promise<void> {
    await this.mysqlPool.execute(
      `UPDATE users
       SET google_id = ?, email_verified_at = COALESCE(email_verified_at, CURRENT_TIMESTAMP)
       WHERE id = ?`,
      [googleId, userId]
    );
  }
}
