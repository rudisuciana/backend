import { afterEach, describe, expect, it, vi } from 'vitest';
import { getFlazdataProducts } from '../src/modules/providers/flazdata/products';

const originalEnv = { ...process.env };

describe('Flazdata products mapper', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  it('should map only requested fields and add version 1', async () => {
    process.env.FLAZ_URL = 'https://example.com';
    process.env.FLAZ_API = 'secret-key';

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: [
          {
            code: 'XLFXXXXL',
            name: 'SUPER 🔥',
            price: 107000,
            stock: 0,
            fee: 600,
            is_trial: false,
            description: ['line1', 'line2']
          },
          {
            code: 'TPENDING',
            name: 'Demo respon pending',
            price: 0,
            stock: 1,
            feee: 600,
            is_reused: false,
            description: []
          }
        ]
      })
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await getFlazdataProducts();

    expect(fetchMock).toHaveBeenCalledWith('https://example.com/mpa/product-stock', {
      method: 'POST',
      headers: {
        'x-api-key': 'secret-key'
      }
    });
    expect(result).toEqual([
      {
        code: 'XLFXXXXL',
        name: 'SUPER 🔥',
        price: 107000,
        stock: 0,
        description: ['line1', 'line2'],
        version: 1
      },
      {
        code: 'TPENDING',
        name: 'Demo respon pending',
        price: 0,
        stock: 1,
        description: [],
        version: 1
      }
    ]);
  });

  it('should throw when required env is missing', async () => {
    delete process.env.FLAZ_URL;
    process.env.FLAZ_API = 'secret-key';

    await expect(getFlazdataProducts()).rejects.toThrow('FLAZ_URL_IS_REQUIRED');
  });

  it('should throw when flazdata request fails', async () => {
    process.env.FLAZ_URL = 'https://example.com/';
    process.env.FLAZ_API = 'secret-key';

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401
      })
    );

    await expect(getFlazdataProducts()).rejects.toThrow('FLAZDATA_REQUEST_FAILED:401');
  });
});
