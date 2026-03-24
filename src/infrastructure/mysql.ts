import mysql, { type Pool } from 'mysql2/promise';
import { env } from '../config/env';

let pool: Pool | null = null;

export const getMySQLPool = (): Pool => {
  if (!pool) {
    pool = mysql.createPool({
      host: env.mysql.host,
      port: env.mysql.port,
      user: env.mysql.user,
      password: env.mysql.password,
      database: env.mysql.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }

  return pool;
};
