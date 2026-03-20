import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.route';
import { requireApiKey } from '../middlewares/apiKey.middleware';
import { listAkrabProducts } from '../modules/akrab';
import { userRouter } from '../modules/user/user.route';
import { websiteRouter } from '../modules/website/website.route';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/website', websiteRouter);
apiRouter.use('/user', userRouter);
apiRouter.get('/akrab-products', requireApiKey('user'), async (_req, res) => {
  const products = await listAkrabProducts();
  res.json({
    success: true,
    data: products
  });
});

export { apiRouter };
