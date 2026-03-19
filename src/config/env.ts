import { config } from 'dotenv';

config();

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: toNumber(process.env.PORT, 3000),
  logLevel: process.env.LOG_LEVEL ?? 'info',
  websiteApiKey: process.env.WEBSITE_API_KEY ?? 'website-secret-key',
  userApiKey: process.env.USER_API_KEY ?? 'user-secret-key',
  mysql: {
    host: process.env.MYSQL_HOST ?? 'localhost',
    port: toNumber(process.env.MYSQL_PORT, 3306),
    user: process.env.MYSQL_USER ?? 'root',
    password: process.env.MYSQL_PASSWORD ?? 'root',
    database: process.env.MYSQL_DATABASE ?? 'ppob_blueprint'
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: toNumber(process.env.REDIS_PORT, 6379),
    password: process.env.REDIS_PASSWORD
  }
};

export const isTest = env.nodeEnv === 'test';
