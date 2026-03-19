import { Router } from 'express';
import { getMySQLPool } from '../../infrastructure/mysql';
import { getRedisClient } from '../../infrastructure/redis';
import { requireApiKey } from '../../middlewares/apiKey.middleware';
import { WebsiteController } from './website.controller';
import { WebsiteRepository } from './website.repository';
import { WebsiteService } from './website.service';

const websiteRouter = Router();

const websiteRepository = new WebsiteRepository(getMySQLPool(), getRedisClient());
const websiteService = new WebsiteService(websiteRepository);
const websiteController = new WebsiteController(websiteService);

websiteRouter.use(requireApiKey('website'));
websiteRouter.get('/ping', websiteController.ping);
websiteRouter.get('/products', websiteController.getProducts);

export { websiteRouter };
