import { describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import { WebsiteController } from '../src/modules/website/website.controller';

describe('WebsiteController', () => {
  it('should call next when getProducts service throws', async () => {
    const websiteService = {
      getProducts: vi.fn().mockRejectedValue(new Error('DB_DOWN'))
    };
    const controller = new WebsiteController(websiteService as never);
    const req = {} as Request;
    const res = {
      json: vi.fn()
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    await controller.getProducts(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.json).not.toHaveBeenCalled();
  });

  it('should call next when getAkrabProducts service throws', async () => {
    const websiteService = {
      getAkrabProducts: vi.fn().mockRejectedValue(new Error('PROVIDER_DOWN'))
    };
    const controller = new WebsiteController(websiteService as never);
    const req = {} as Request;
    const res = {
      json: vi.fn()
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    await controller.getAkrabProducts(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.json).not.toHaveBeenCalled();
  });
});
