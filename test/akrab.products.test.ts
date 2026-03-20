import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/modules/providers/flazdata/products', () => ({
  getFlazdataProducts: vi.fn()
}));
vi.mock('../src/modules/providers/kaje/products', () => ({
  getKajeProducts: vi.fn()
}));
vi.mock('../src/modules/providers/khfy/products', () => ({
  getKhfyProducts: vi.fn()
}));

import { listAkrabProducts } from '../src/modules/akrab';
import { getFlazdataProducts } from '../src/modules/providers/flazdata/products';
import { getKajeProducts } from '../src/modules/providers/kaje/products';
import { getKhfyProducts } from '../src/modules/providers/khfy/products';

describe('listAkrabProducts', () => {
  it('should merge products from flazdata, kaje and khfy', async () => {
    vi.mocked(getFlazdataProducts).mockResolvedValue([
      {
        code: 'F1',
        name: 'Flaz',
        price: 1000,
        stock: 1,
        category: 'Akrab Anggota',
        description: ['d1'],
        version: 1
      }
    ]);
    vi.mocked(getKajeProducts).mockResolvedValue([
      {
        code: 'K1',
        name: 'Kaje',
        price: 2000,
        stock: 2,
        category: 'Akrab Anggota',
        description: ['d2'],
        version: 2
      }
    ]);
    vi.mocked(getKhfyProducts).mockResolvedValue([
      {
        code: 'H1',
        name: 'Khfy',
        price: 3000,
        stock: 3,
        category: 'Akrab Anggota',
        description: ['d3'],
        version: 3
      }
    ]);

    await expect(listAkrabProducts()).resolves.toEqual([
      {
        code: 'F1',
        name: 'Flaz',
        price: 1000,
        stock: 1,
        category: 'Akrab Anggota',
        description: ['d1'],
        version: 1
      },
      {
        code: 'K1',
        name: 'Kaje',
        price: 2000,
        stock: 2,
        category: 'Akrab Anggota',
        description: ['d2'],
        version: 2
      },
      {
        code: 'H1',
        name: 'Khfy',
        price: 3000,
        stock: 3,
        category: 'Akrab Anggota',
        description: ['d3'],
        version: 3
      }
    ]);
  });

  it('should ignore failed provider and still return other results', async () => {
    vi.mocked(getFlazdataProducts).mockRejectedValue(new Error('failed'));
    vi.mocked(getKajeProducts).mockResolvedValue([]);
    vi.mocked(getKhfyProducts).mockResolvedValue([
      {
        code: 'H1',
        name: 'Khfy',
        price: 3000,
        stock: 3,
        category: 'Akrab Anggota',
        description: ['d3'],
        version: 3
      }
    ]);

    await expect(listAkrabProducts()).resolves.toEqual([
      {
        code: 'H1',
        name: 'Khfy',
        price: 3000,
        stock: 3,
        category: 'Akrab Anggota',
        description: ['d3'],
        version: 3
      }
    ]);
  });
});
