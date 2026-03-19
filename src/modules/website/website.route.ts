import { Router } from 'express';
import { requireAccessToken } from '../../middlewares/accessToken.middleware';
import { getMySQLPool } from '../../infrastructure/mysql';
import { getRedisClient } from '../../infrastructure/redis';
import { WebsiteController } from './website.controller';
import { WebsiteRepository } from './website.repository';
import { WebsiteService } from './website.service';

const websiteRouter = Router();

const websiteRepository = new WebsiteRepository(getMySQLPool(), getRedisClient());
const websiteService = new WebsiteService(websiteRepository);
const websiteController = new WebsiteController(websiteService);

websiteRouter.get('/ping', websiteController.ping);
websiteRouter.get('/products', requireAccessToken(), websiteController.getProducts);

export { websiteRouter };
