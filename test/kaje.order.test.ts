import { afterEach, describe, expect, it, vi } from 'vitest';
import { createKajeOrder } from '../src/modules/providers/kaje/order';
import * as helpers from '../src/utils/helpers';

const originalEnv = { ...process.env };

describe('Kaje order', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  it('should call order-product and return mapped payload fields', async () => {
    process.env.KAJE_URL = 'https://example.com';
    process.env.KAJE_API = 'secret-key';

    vi.spyOn(helpers, 'orderId').mockReturnValue('ORDER123');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            status: 'pending',
            ref_id: 'WZ123',
            trx_id: 'KJR123',
            destination: '087760204418',
            message: 'Transaksi akan segera diproses.'
          }
        })
      })
    );

    const result = await createKajeOrder({
      number: '087760204418',
      code: 'PULSA10'
    });

    expect(result).toEqual({
      trx_id: 'KJR123',
      invoice_no: 'WZ123',
      product_id: 'PULSA10',
      number: '087760204418',
      status: 'pending',
      description: 'Transaksi akan segera diproses.'
    });
  });

  it('should reject unsupported providers before request', async () => {
    process.env.KAJE_URL = 'https://example.com';
    process.env.KAJE_API = 'secret-key';

    await expect(createKajeOrder({ number: '081312345678', code: 'PULSA10' })).rejects.toThrow(
      'UNSUPPORTED_PROVIDER'
    );
  });
});
