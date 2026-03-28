import type { NextFunction, Request, Response } from 'express';
import { WebsiteService } from './website.service';

export class WebsiteController {
  constructor(private readonly websiteService: WebsiteService) {}

  ping = (_req: Request, res: Response): void => {
    res.json({
      success: true,
      message: 'Website API reachable'
    });
  };

  getProducts = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const products = await this.websiteService.getProducts();

      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      next(error);
    }
  };

  getAkrabProducts = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const products = await this.websiteService.getAkrabProducts();

      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      next(error);
    }
  };
}
