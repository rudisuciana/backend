import { describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import { WebsiteController } from '../src/modules/website/website.controller';

describe('WebsiteController', () => {
  it('should call next when getProducts service throws', async () => {
    const dbDownError = new Error('DB_DOWN');
    const websiteService = {
      getProducts: vi.fn().mockRejectedValue(dbDownError)
    };
    const controller = new WebsiteController(websiteService as never);
    const req = {} as Request;
    const res = {
      json: vi.fn()
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    await controller.getProducts(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(dbDownError);
    expect(res.json).not.toHaveBeenCalled();
  });

  it('should call next when getAkrabProducts service throws', async () => {
    const providerDownError = new Error('PROVIDER_DOWN');
    const websiteService = {
      getAkrabProducts: vi.fn().mockRejectedValue(providerDownError)
    };
    const controller = new WebsiteController(websiteService as never);
    const req = {} as Request;
    const res = {
      json: vi.fn()
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    await controller.getAkrabProducts(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(providerDownError);
    expect(res.json).not.toHaveBeenCalled();
  });
});
