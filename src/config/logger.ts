import pino from 'pino';
import { env, isTest } from './env';

export const logger = pino({
  level: env.logLevel,
  transport: isTest
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          singleLine: true,
          translateTime: 'SYS:standard'
        }
      }
});
