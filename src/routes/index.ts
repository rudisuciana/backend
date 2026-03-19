import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.route';
import { userRouter } from '../modules/user/user.route';
import { websiteRouter } from '../modules/website/website.route';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/website', websiteRouter);
apiRouter.use('/user', userRouter);

export { apiRouter };
