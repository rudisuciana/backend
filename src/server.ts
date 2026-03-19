import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';

const app = createApp();

app.listen(env.port, () => {
  logger.info(`PPOB backend blueprint running on http://localhost:${env.port}`);
});
