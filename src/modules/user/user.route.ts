import { Router } from 'express';
import { getMySQLPool } from '../../infrastructure/mysql';
import { requireApiKey } from '../../middlewares/apiKey.middleware';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

const userRouter = Router();

const userRepository = new UserRepository(getMySQLPool());
const userService = new UserService(userRepository);
const userController = new UserController(userService);

userRouter.use(requireApiKey('user'));
userRouter.get('/ping', userController.ping);
userRouter.get('/profile', userController.getProfile);

export { userRouter };
