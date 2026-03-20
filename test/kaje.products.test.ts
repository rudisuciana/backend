import { afterEach, describe, expect, it, vi } from 'vitest';
import { getKajeProducts } from '../src/modules/providers/kaje/products';
import * as mysqlInfrastructure from '../src/infrastructure/mysql';

const originalEnv = { ...process.env };

describe('Kaje products mapper', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  it('should map only requested fields and set version 2', async () => {
    process.env.KAJE_URL = 'https://example.com';
    process.env.KAJE_API = 'secret-key';

    vi.spyOn(mysqlInfrastructure, 'getMySQLPool').mockReturnValue({
      query: vi.fn().mockResolvedValue([[{ value: '1500' }], []])
    } as never);

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          info: 'ignored',
          products: [
            {
              code: 'KDA8',
              name: 'Akrab 13-30GB',
              category: 'Akrab Anggota',
              type: 'Paket Data',
              stock: 0,
              price: 42000,
              description: ['line1', 'line2']
            },
            {
              code: 'TPENDING',
              name: 'Trial Produk Pending',
              category: 'Uji Coba',
              stock: 1,
              price: 0,
              description: []
            }
          ]
        }
      })
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await getKajeProducts();

    expect(fetchMock).toHaveBeenCalledWith('https://example.com/service/list-product', {
      method: 'POST',
      headers: {
        'x-api-key': 'secret-key'
      }
    });
    expect(result).toEqual([
      {
        code: 'KDA8',
        name: 'Akrab 13-30GB',
        price: 43500,
        stock: 0,
        category: 'Akrab Anggota',
        description: ['line1', 'line2'],
        version: 2
      },
      {
        code: 'TPENDING',
        name: 'Trial Produk Pending',
        price: 1500,
        stock: 1,
        category: 'Uji Coba',
        description: [],
        version: 2
      }
    ]);
  });

  it('should fallback to base price when default admin fee setting is invalid', async () => {
    process.env.KAJE_URL = 'https://example.com';
    process.env.KAJE_API = 'secret-key';

    vi.spyOn(mysqlInfrastructure, 'getMySQLPool').mockReturnValue({
      query: vi.fn().mockResolvedValue([[{ value: 'invalid' }], []])
    } as never);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            products: [
              {
                code: 'KDA8',
                name: 'Akrab 13-30GB',
                category: 'Akrab Anggota',
                stock: 0,
                price: 42000,
                description: []
              }
            ]
          }
        })
      })
    );

    await expect(getKajeProducts()).resolves.toEqual([
      {
        code: 'KDA8',
        name: 'Akrab 13-30GB',
        price: 42000,
        stock: 0,
        category: 'Akrab Anggota',
        description: [],
        version: 2
      }
    ]);
  });

  it('should throw when required env is missing', async () => {
    delete process.env.KAJE_URL;
    process.env.KAJE_API = 'secret-key';

    vi.spyOn(mysqlInfrastructure, 'getMySQLPool').mockReturnValue({
      query: vi.fn().mockResolvedValue([[{ value: '1500' }], []])
    } as never);

    await expect(getKajeProducts()).rejects.toThrow('KAJE_URL_IS_REQUIRED');
  });

  it('should return empty array when kaje request fails', async () => {
    process.env.KAJE_URL = 'https://example.com/';
    process.env.KAJE_API = 'secret-key';

    vi.spyOn(mysqlInfrastructure, 'getMySQLPool').mockReturnValue({
      query: vi.fn().mockResolvedValue([[{ value: '1500' }], []])
    } as never);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401
      })
    );

    await expect(getKajeProducts()).resolves.toEqual([]);
  });

  it('should return empty array when kaje success is false', async () => {
    process.env.KAJE_URL = 'https://example.com/';
    process.env.KAJE_API = 'secret-key';

    vi.spyOn(mysqlInfrastructure, 'getMySQLPool').mockReturnValue({
      query: vi.fn().mockResolvedValue([[{ value: '1500' }], []])
    } as never);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: false,
          data: {
            products: []
          }
        })
      })
    );

    await expect(getKajeProducts()).resolves.toEqual([]);
  });
});
