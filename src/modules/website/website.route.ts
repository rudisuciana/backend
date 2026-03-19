import { Router } from 'express';
import rateLimit from 'express-rate-limit';
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
const websiteProductsLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many request for products, please try again later'
  }
});

websiteRouter.get('/ping', websiteController.ping);
websiteRouter.get('/products', websiteProductsLimiter, requireAccessToken(), websiteController.getProducts);

export { websiteRouter };
