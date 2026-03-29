import type { NextFunction, Request, Response } from 'express';
import { WebsiteService } from './website.service';
import { z } from 'zod';

const createOrderSchema = z.object({
  number: z.string().trim().min(8),
  code: z.string().trim().min(1)
});

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

  createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid order payload'
      });
      return;
    }

    if (!req.authUserId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
      return;
    }

    try {
      const result = await this.websiteService.createOrder({
        userId: req.authUserId,
        number: parsed.data.number,
        code: parsed.data.code
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'UNSUPPORTED_PROVIDER') {
        res.status(400).json({
          success: false,
          message: 'Provider number tidak didukung'
        });
        return;
      }

      if (error instanceof Error && error.message === 'PRODUCT_NOT_FOUND') {
        res.status(404).json({
          success: false,
          message: 'Product tidak ditemukan'
        });
        return;
      }

      next(error);
    }
  };
}
