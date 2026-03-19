import type { Pool, RowDataPacket } from 'mysql2/promise';

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  balance: number;
  status: string;
}

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  balance: number;
  status: string;
}

export class UserRepository {
  constructor(private readonly mysqlPool: Pool) {}

  async getProfileById(id: number): Promise<UserProfile | null> {
    const [rows] = await this.mysqlPool.query<UserRow[]>(
      `SELECT id, name, email, balance, status
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
      status: row.status
    };
  }
}
