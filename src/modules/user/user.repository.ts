import type { Pool, RowDataPacket } from 'mysql2/promise';

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  balance: number;
  status: string;
  avatar: string | null;
}

export interface UserApiKeyAccess {
  whitelistip: string | null;
}

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  balance: number;
  status: string;
  avatar: string | null;
  whitelistip: string | null;
}

export class UserRepository {
  constructor(private readonly mysqlPool: Pool) {}

  async getProfileByApiKey(apiKey: string): Promise<UserProfile | null> {
    const [rows] = await this.mysqlPool.query<UserRow[]>(
      `SELECT id, name, email, balance, status, avatar
       FROM users
       WHERE apikey = ?
       LIMIT 1`,
      [apiKey]
    );

    if (!rows.length) {
      return null;
    }

    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      balance: Number(row.balance),
      status: row.status,
      avatar: row.avatar
    };
  }

  async getApiKeyAccessByApiKey(apiKey: string): Promise<UserApiKeyAccess | null> {
    const [rows] = await this.mysqlPool.query<UserRow[]>(
      `SELECT whitelistip
       FROM users
       WHERE apikey = ?
       LIMIT 1`,
      [apiKey]
    );

    if (!rows.length) {
      return null;
    }

    return {
      whitelistip: rows[0].whitelistip
    };
  }

  async getProfileById(id: number): Promise<UserProfile | null> {
    const [rows] = await this.mysqlPool.query<UserRow[]>(
      `SELECT id, name, email, balance, status, avatar
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    if (!rows.length) {
      return null;
    }

    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      balance: Number(row.balance),
      status: row.status,
      avatar: row.avatar
    };
  }
}
