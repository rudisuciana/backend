import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { logger } from './config/logger';
import { loadOpenApiDocument } from './docs';
import { getMySQLPool } from './infrastructure/mysql';
import { getRedisClient } from './infrastructure/redis';
import { errorHandler } from './middlewares/error.middleware';
import { notFoundHandler } from './middlewares/notFound.middleware';
import { apiRouter } from './routes';

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(pinoHttp({ logger }));

  app.get('/health', async (_req, res) => {
    const mysqlPool = getMySQLPool();
    const redisClient = getRedisClient();

    const [mysqlStatus, redisStatus] = await Promise.allSettled([
      mysqlPool.query('SELECT 1'),
      (async () => {
        if (redisClient.status === 'wait') {
          await redisClient.connect();
        }

        const pong = await redisClient.ping();
        if (pong !== 'PONG') {
          throw new Error('Unexpected Redis ping response');
        }
      })()
    ]);

    const isMysqlUp = mysqlStatus.status === 'fulfilled';
    const isRedisUp = redisStatus.status === 'fulfilled';

    const statusCode = isMysqlUp && isRedisUp ? 200 : 503;

    res.status(statusCode).json({
      success: isMysqlUp && isRedisUp,
      services: {
        mysql: isMysqlUp ? 'up' : 'down',
        redis: isRedisUp ? 'up' : 'down'
      }
    });
  });

  app.use('/api/v1', apiRouter);
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(loadOpenApiDocument()));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
