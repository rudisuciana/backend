import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { isTest } from '../../config/env';
import { getMySQLPool } from '../../infrastructure/mysql';
import { getRedisClient } from '../../infrastructure/redis';
import { RedisRateLimitStore } from '../../middlewares/redisRateLimitStore';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';

const authRouter = Router();

const authRepository = new AuthRepository(getMySQLPool());
const authService = new AuthService(authRepository, getRedisClient());
const authController = new AuthController(authService);
const authRateLimitWindowMs = 60 * 1000;

const authRateLimiter = rateLimit({
  windowMs: authRateLimitWindowMs,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  passOnStoreError: true,
  ...(isTest
    ? {}
    : {
        store: new RedisRateLimitStore(getRedisClient(), authRateLimitWindowMs, 'rate-limit:auth')
      }),
  message: {
    success: false,
    message: 'Too many auth requests, please try again later'
  }
});

authRouter.use(authRateLimiter);

authRouter.post('/register', authController.registerManual);
authRouter.post('/verify-otp', authController.verifyOtp);
authRouter.post('/verify-mfa', authController.verifyMfa);
authRouter.post('/login', authController.login);
authRouter.post('/refresh-token', authController.refreshToken);
authRouter.post('/logout', authController.logout);
authRouter.post('/forgot-password', authController.forgotPassword);
authRouter.post('/reset-password', authController.resetPassword);
authRouter.post('/google/register', authController.registerGoogle);
authRouter.post('/google/login', authController.loginGoogle);

export { authRouter };
