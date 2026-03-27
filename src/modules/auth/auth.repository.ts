import { randomUUID } from 'node:crypto';
import type { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { logger } from '../../config/logger';
import type { AuthPolicy, AuthSecurityLog, AuthSession, AuthUser } from './auth.types';

const ACCOUNT_LOCK_THRESHOLD = 5;
const ACCOUNT_LOCK_DURATION_MINUTES = 15;

interface AuthUserRow extends RowDataPacket {
  id: number;
  username: string;
  name: string;
  email: string;
  phone: string;
  apikey: string;
  avatar: string | null;
  balance: number;
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

interface SessionRow extends RowDataPacket {
  id: number;
  refresh_token_expired: string;
  user_agent: string | null;
  ip_address: string | null;
  created_at: string;
}

interface SecurityLogRow extends RowDataPacket {
  id: number;
  event: string;
  ip_address: string | null;
  user_agent: string | null;
  metadata: string | null;
  created_at: string;
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

const authUserSelectSql = `SELECT id, username, name, email, phone, apikey, avatar, balance, password_hash, google_id, email_verified_at, refresh_token_hash, refresh_token_expired, multilogin, failed_login_attempts, locked_until, mfa_enabled, mfa_otp_hash, mfa_otp_expired, status
 FROM users`;

const toAuthUser = (row: AuthUserRow): AuthUser => ({
  id: row.id,
  username: row.username,
  name: row.name,
  email: row.email,
  phone: row.phone,
  apikey: row.apikey,
  avatar: row.avatar,
  balance: Number(row.balance),
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

  /**
   * Execute multiple database operations atomically within a transaction.
   * If any operation fails, all changes are rolled back.
   */
  private async withTransaction<T>(
    callback: (connection: PoolConnection) => Promise<T>
  ): Promise<T> {
    const connection = await this.mysqlPool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

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
    try {
      await this.mysqlPool.execute(
        `UPDATE users
         SET email_verified_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [userId]
      );
    } catch (error: unknown) {
      // Rethrow - email verification is critical for registration flow
      throw error;
    }
  }

  async setRefreshTokenHash(
    userId: number,
    refreshTokenHash: string | null,
    refreshTokenExpired: string | null = null
  ): Promise<void> {
    try {
      await this.mysqlPool.execute(
        `UPDATE users
         SET refresh_token_hash = ?, refresh_token_expired = ?
         WHERE id = ?`,
        [refreshTokenHash, refreshTokenExpired, userId]
      );
    } catch (error: unknown) {
      // Rethrow - token storage is critical for authentication
      throw error;
    }
  }

  /**
   * Store refresh token and create session atomically within a transaction.
   * This ensures consistency between user refresh token and session records.
   */
  async setRefreshTokenAndCreateSession(
    userId: number,
    refreshTokenHash: string,
    refreshTokenExpired: string | null
  ): Promise<void> {
    if (!refreshTokenExpired) {
      return;
    }

    await this.withTransaction(async (connection) => {
      // Step 1: Set refresh token in users table
      await connection.execute(
        `UPDATE users
         SET refresh_token_hash = ?, refresh_token_expired = ?
         WHERE id = ?`,
        [refreshTokenHash, refreshTokenExpired, userId]
      );

      // Step 2: Create session record
      await connection.execute(
        `INSERT INTO user_sessions (user_id, refresh_token_hash, refresh_token_expired)
         VALUES (?, ?, ?)`,
        [userId, refreshTokenHash, refreshTokenExpired]
      );
    });
  }

  async setMultilogin(userId: number, multilogin: boolean): Promise<void> {
    try {
      await this.mysqlPool.execute(
        `UPDATE users
         SET multilogin = ?
         WHERE id = ?`,
        [multilogin ? 1 : 0, userId]
      );
    } catch (error: unknown) {
      // Rethrow - settings update should fail explicitly if DB is unavailable
      throw error;
    }
  }

  async setMfaEnabled(userId: number, mfaEnabled: boolean): Promise<void> {
    try {
      await this.mysqlPool.execute(
        `UPDATE users
         SET mfa_enabled = ?
         WHERE id = ?`,
        [mfaEnabled ? 1 : 0, userId]
      );
    } catch (error: unknown) {
      // Rethrow - settings update should fail explicitly if DB is unavailable
      throw error;
    }
  }

  async getAuthPolicy(userId: number): Promise<AuthPolicy | null> {
    const [rows] = await this.mysqlPool.query<AuthUserRow[]>(
      `SELECT multilogin, mfa_enabled
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [userId]
    );

    if (!rows.length) {
      return null;
    }

    return {
      multilogin: Boolean(rows[0].multilogin),
      mfaEnabled: Boolean(rows[0].mfa_enabled)
    };
  }

  async clearRefreshSessions(userId: number): Promise<void> {
    await this.withTransaction(async (connection) => {
      // Step 1: Clear refresh token in users table
      await connection.execute(
        `UPDATE users
         SET refresh_token_hash = NULL, refresh_token_expired = NULL
         WHERE id = ?`,
        [userId]
      );

      // Step 2: Revoke all active sessions
      await connection.execute(
        `UPDATE user_sessions
         SET revoked_at = CURRENT_TIMESTAMP
         WHERE user_id = ? AND revoked_at IS NULL`,
        [userId]
      );
    });
  }

  async incrementFailedLoginAttempts(userId: number): Promise<void> {
    try {
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
    } catch (error: unknown) {
      // Log but don't throw - failed login attempt tracking should not block login process
      // The error is likely a DB connection issue which is transient
      logger.warn({ userId, error }, 'Failed to increment failed login attempts');
      return;
    }
  }

  async clearFailedLoginAttempts(userId: number): Promise<void> {
    try {
      await this.mysqlPool.execute(
        `UPDATE users
         SET failed_login_attempts = 0, locked_until = NULL
         WHERE id = ?`,
        [userId]
      );
    } catch (error: unknown) {
      // Log but don't throw - clearing failed attempts should not block successful login
      logger.warn({ userId, error }, 'Failed to clear failed login attempts');
      return;
    }
  }

  async storeMfaOtp(userId: number, otpHash: string, expiredAtIso: string): Promise<void> {
    try {
      await this.mysqlPool.execute(
        `UPDATE users
         SET mfa_otp_hash = ?, mfa_otp_expired = ?
         WHERE id = ?`,
        [otpHash, expiredAtIso, userId]
      );
    } catch (error: unknown) {
      // Rethrow - MFA OTP storage is critical for MFA flow
      throw error;
    }
  }

  async clearMfaOtp(userId: number): Promise<void> {
    try {
      await this.mysqlPool.execute(
        `UPDATE users
         SET mfa_otp_hash = NULL, mfa_otp_expired = NULL
         WHERE id = ?`,
        [userId]
      );
    } catch (error: unknown) {
      // Rethrow - clearing MFA OTP is critical to prevent OTP replay attacks
      // If we can't clear the OTP, we must fail the operation to maintain security
      throw error;
    }
  }

  async createSession(
    userId: number,
    refreshTokenHash: string,
    refreshTokenExpired: string | null
  ): Promise<void> {
    if (!refreshTokenExpired) {
      return;
    }

    try {
      await this.mysqlPool.execute(
        `INSERT INTO user_sessions (user_id, refresh_token_hash, refresh_token_expired)
         VALUES (?, ?, ?)`,
        [userId, refreshTokenHash, refreshTokenExpired]
      );
    } catch (error: unknown) {
      // Tolerate missing table to avoid breaking auth flow during partial migrations
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ER_NO_SUCH_TABLE') {
        return;
      }
      throw error;
    }
  }

  async revokeActiveSessions(userId: number): Promise<void> {
    try {
      await this.mysqlPool.execute(
        `UPDATE user_sessions
         SET revoked_at = CURRENT_TIMESTAMP
         WHERE user_id = ? AND revoked_at IS NULL`,
        [userId]
      );
    } catch (error: unknown) {
      // Tolerate missing table to avoid breaking auth flow during partial migrations
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ER_NO_SUCH_TABLE') {
        return;
      }
      throw error;
    }
  }

  async getActiveSessionsByUserId(userId: number): Promise<AuthSession[]> {
    try {
      const [rows] = await this.mysqlPool.query<SessionRow[]>(
        `SELECT id, refresh_token_expired, user_agent, ip_address, created_at
         FROM user_sessions
         WHERE user_id = ? AND revoked_at IS NULL AND refresh_token_expired > CURRENT_TIMESTAMP
         ORDER BY created_at DESC`,
        [userId]
      );

      return rows.map((row) => ({
        id: row.id,
        refreshTokenExpired: row.refresh_token_expired,
        userAgent: row.user_agent,
        ipAddress: row.ip_address,
        createdAt: row.created_at
      }));
    } catch (error: unknown) {
      // Tolerate missing table to avoid breaking auth flow during partial migrations
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ER_NO_SUCH_TABLE') {
        return [];
      }
      throw error;
    }
  }

  async revokeSessionById(userId: number, sessionId: number): Promise<boolean> {
    try {
      const [result] = await this.mysqlPool.execute<ResultSetHeader>(
        `UPDATE user_sessions
         SET revoked_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ? AND revoked_at IS NULL`,
        [sessionId, userId]
      );

      return result.affectedRows > 0;
    } catch (error: unknown) {
      // Tolerate missing table to avoid breaking auth flow during partial migrations
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ER_NO_SUCH_TABLE') {
        return false;
      }
      throw error;
    }
  }

  async getSecurityLogsByUserId(userId: number, limit: number): Promise<AuthSecurityLog[]> {
    try {
      const [rows] = await this.mysqlPool.query<SecurityLogRow[]>(
        `SELECT id, event, ip_address, user_agent, metadata, created_at
         FROM auth_security_logs
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT ?`,
        [userId, limit]
      );

      return rows.map((row) => ({
        id: row.id,
        event: row.event,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        metadata: row.metadata,
        createdAt: row.created_at
      }));
    } catch (error: unknown) {
      // Tolerate missing table to avoid breaking auth flow during partial migrations
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ER_NO_SUCH_TABLE') {
        return [];
      }
      throw error;
    }
  }

  async createSecurityLog(userId: number | null, event: string, metadata?: string): Promise<void> {
    try {
      await this.mysqlPool.execute(
        `INSERT INTO auth_security_logs (user_id, event, metadata)
         VALUES (?, ?, ?)`,
        [userId, event, metadata ?? null]
      );
    } catch (error: unknown) {
      // Tolerate missing table to avoid breaking auth flow during partial migrations
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ER_NO_SUCH_TABLE') {
        return;
      }
      throw error;
    }
  }

  async updatePasswordHash(userId: number, passwordHash: string): Promise<void> {
    try {
      await this.mysqlPool.execute(
        `UPDATE users
         SET password_hash = ?
         WHERE id = ?`,
        [passwordHash, userId]
      );
    } catch (error: unknown) {
      // Rethrow - password update is critical for password reset flow
      throw error;
    }
  }

  /**
   * Update password and clear refresh token atomically within a transaction.
   * This ensures the user must re-authenticate after password reset.
   */
  async updatePasswordAndClearRefreshToken(userId: number, passwordHash: string): Promise<void> {
    await this.withTransaction(async (connection) => {
      // Step 1: Update password
      await connection.execute(
        `UPDATE users
         SET password_hash = ?
         WHERE id = ?`,
        [passwordHash, userId]
      );

      // Step 2: Clear refresh token to invalidate all sessions
      await connection.execute(
        `UPDATE users
         SET refresh_token_hash = NULL, refresh_token_expired = NULL
         WHERE id = ?`,
        [userId]
      );
    });
  }

  async linkGoogleId(userId: number, googleId: string): Promise<void> {
    try {
      await this.mysqlPool.execute(
        `UPDATE users
         SET google_id = ?, email_verified_at = COALESCE(email_verified_at, CURRENT_TIMESTAMP)
         WHERE id = ?`,
        [googleId, userId]
      );
    } catch (error: unknown) {
      // Rethrow - linking Google ID is critical for OAuth flow
      throw error;
    }
  }
}
