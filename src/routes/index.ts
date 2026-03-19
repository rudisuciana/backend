import { Router } from 'express';
import { userRouter } from '../modules/user/user.route';
import { websiteRouter } from '../modules/website/website.route';

const apiRouter = Router();

apiRouter.use('/website', websiteRouter);
apiRouter.use('/user', userRouter);

export { apiRouter };
