import { afterEach, describe, expect, it, vi } from 'vitest';
import { getKhfyProducts } from '../src/modules/providers/khfy/products';
import * as mysqlInfrastructure from '../src/infrastructure/mysql';

describe('Khfy products mapper', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should merge khfy stock with akrab table and set version 3', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          message: 'success',
          data: [
            { type: 'XLA14', nama: 'SuperMini', sisa_slot: 0 },
            { type: 'XLA32', nama: 'Mini', sisa_slot: 1 },
            { type: 'UNKNOWN', nama: 'Unknown', sisa_slot: 3 }
          ]
        })
      })
    );

    const queryMock = vi.fn().mockResolvedValue([
      [
        {
          code: 'XLA14',
          name: 'SuperMini PROMO',
          price: '43000',
          category: 'Akrab Anggota',
          description: JSON.stringify(['desc 1'])
        },
        {
          code: 'XLA32',
          name: 'Mini',
          price: 55500,
          category: 'Akrab Anggota',
          description: ['desc 2']
        }
      ],
      []
    ]);

    vi.spyOn(mysqlInfrastructure, 'getMySQLPool').mockReturnValue({
      query: queryMock
    } as never);

    const result = await getKhfyProducts();

    expect(result).toEqual([
      {
        code: 'XLA14',
        name: 'SuperMini PROMO',
        price: 43000,
        stock: 0,
        category: 'Akrab Anggota',
        description: ['desc 1'],
        version: 3
      },
      {
        code: 'XLA32',
        name: 'Mini',
        price: 55500,
        stock: 1,
        category: 'Akrab Anggota',
        description: ['desc 2'],
        version: 3
      }
    ]);

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('FROM akrab'),
      ['XLA14', 'XLA32', 'UNKNOWN']
    );
  });

  it('should return empty array when khfy request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500
      })
    );

    await expect(getKhfyProducts()).resolves.toEqual([]);
  });

  it('should return empty array when khfy response ok is false', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: false,
          data: []
        })
      })
    );

    await expect(getKhfyProducts()).resolves.toEqual([]);
  });
});
