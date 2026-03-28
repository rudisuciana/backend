import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { isTest } from '../../config/env';
import { getMySQLPool } from '../../infrastructure/mysql';
import { getRedisClient } from '../../infrastructure/redis';
import { RedisRateLimitStore } from '../../middlewares/redisRateLimitStore';
import { requireApiKey } from '../../middlewares/apiKey.middleware';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

const userRouter = Router();

const userRepository = new UserRepository(getMySQLPool());
const userService = new UserService(userRepository);
const userController = new UserController(userService);
const userRateLimitWindowMs = 60 * 1000;
const userRateLimiter = rateLimit({
  windowMs: userRateLimitWindowMs,
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  passOnStoreError: false,
  ...(isTest
    ? {}
    : {
        store: new RedisRateLimitStore(getRedisClient(), userRateLimitWindowMs, 'rate-limit:user')
      }),
  message: {
    success: false,
    message: 'Too many user requests, please try again later'
  }
});

userRouter.use(userRateLimiter);
userRouter.use(requireApiKey('user'));
userRouter.get('/ping', userController.ping);
userRouter.get('/profile', userController.getProfile);

export { userRouter };
