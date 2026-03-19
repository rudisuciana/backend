import { randomUUID } from 'node:crypto';
import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import type { AuthUser } from './auth.types';

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

const authUserSelectSql = `SELECT id, username, name, email, phone, apikey, password_hash, google_id, email_verified_at, refresh_token_hash, status
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

  async setRefreshTokenHash(userId: number, refreshTokenHash: string | null): Promise<void> {
    await this.mysqlPool.execute(
      `UPDATE users
       SET refresh_token_hash = ?
       WHERE id = ?`,
      [refreshTokenHash, userId]
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
