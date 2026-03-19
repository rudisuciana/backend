import { Router } from 'express';
import { getMySQLPool } from '../../infrastructure/mysql';
import { getRedisClient } from '../../infrastructure/redis';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';

const authRouter = Router();

const authRepository = new AuthRepository(getMySQLPool());
const authService = new AuthService(authRepository, getRedisClient());
const authController = new AuthController(authService);

authRouter.post('/register', authController.registerManual);
authRouter.post('/verify-otp', authController.verifyOtp);
authRouter.post('/login', authController.login);
authRouter.post('/refresh-token', authController.refreshToken);
authRouter.post('/forgot-password', authController.forgotPassword);
authRouter.post('/reset-password', authController.resetPassword);
authRouter.post('/google/register', authController.registerGoogle);
authRouter.post('/google/login', authController.loginGoogle);

export { authRouter };
