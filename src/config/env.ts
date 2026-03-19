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
  cors: {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000'
  },
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
  },
  auth: {
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET ?? 'access-secret-key',
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET ?? 'refresh-secret-key',
    accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN ?? '15m',
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ?? '7d',
    otpTtlSeconds: toNumber(process.env.OTP_TTL_SECONDS, 300)
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI ?? '',
    oauthRefreshToken: process.env.GOOGLE_OAUTH_REFRESH_TOKEN ?? '',
    senderEmail: process.env.GOOGLE_SENDER_EMAIL ?? ''
  }
};

if (env.nodeEnv === 'production') {
  const hasMinimumSecretLength =
    env.userApiKey.length >= 32 &&
    env.auth.accessTokenSecret.length >= 32 &&
    env.auth.refreshTokenSecret.length >= 32;

  if (!hasMinimumSecretLength) {
    throw new Error(
      'Production requires USER_API_KEY, ACCESS_TOKEN_SECRET, and REFRESH_TOKEN_SECRET with minimum length 32 characters'
    );
  }
}

export const isTest = env.nodeEnv === 'test';
