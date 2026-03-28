import { describe, expect, it, vi } from 'vitest';
import { WebsiteRepository } from '../src/modules/website/website.repository';

describe('WebsiteRepository', () => {
  it('should fallback to mysql when redis get throws', async () => {
    const mysqlPool = {
      query: vi.fn().mockResolvedValue([
        [
          {
            id: 1,
            code: 'PLN20',
            name: 'Token PLN 20.000',
            category: 'electricity',
            price: 20500,
            admin_fee: 2500,
            is_active: 1
          }
        ]
      ])
    };
    const redisClient = {
      get: vi.fn().mockRejectedValue(new Error('REDIS_DOWN')),
      set: vi.fn().mockResolvedValue('OK'),
      del: vi.fn()
    };

    const repository = new WebsiteRepository(mysqlPool as never, redisClient as never);
    const result = await repository.listProducts();

    expect(mysqlPool.query).toHaveBeenCalledTimes(1);
    expect(result).toEqual([
      {
        code: 'PLN20',
        name: 'Token PLN 20.000',
        category: 'electricity',
        price: 20500,
        adminFee: 2500,
        isActive: true
      }
    ]);
  });

  it('should fallback to mysql when redis set throws', async () => {
    const mysqlPool = {
      query: vi.fn().mockResolvedValue([
        [
          {
            id: 1,
            code: 'PLN20',
            name: 'Token PLN 20.000',
            category: 'electricity',
            price: 20500,
            admin_fee: 2500,
            is_active: 1
          }
        ]
      ])
    };
    const redisClient = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockRejectedValue(new Error('REDIS_WRITE_FAIL')),
      del: vi.fn()
    };

    const repository = new WebsiteRepository(mysqlPool as never, redisClient as never);
    const result = await repository.listProducts();

    expect(mysqlPool.query).toHaveBeenCalledTimes(1);
    expect(result).toEqual([
      {
        code: 'PLN20',
        name: 'Token PLN 20.000',
        category: 'electricity',
        price: 20500,
        adminFee: 2500,
        isActive: true
      }
    ]);
  });
});
