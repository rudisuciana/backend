import { getFlazdataProducts } from '../flazdata/products';
import { getKajeProducts } from '../kaje/products';
import { getKhfyProducts } from '../khfy/products';

export interface AkrabProduct {
  code: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  description: string[];
  version: number;
}

const toAkrabProduct = (product: AkrabProduct): AkrabProduct => ({
  code: product.code,
  name: product.name,
  price: product.price,
  stock: product.stock,
  category: product.category,
  description: product.description,
  version: product.version
});

export const listAkrabProducts = async (): Promise<AkrabProduct[]> => {
  // Tetap lanjut walau salah satu provider gagal agar endpoint tetap responsif.
  const results = await Promise.allSettled([getFlazdataProducts(), getKajeProducts(), getKhfyProducts()]);

  return results.flatMap((result) => {
    if (result.status !== 'fulfilled') {
      return [];
    }

    return result.value.map((product) => toAkrabProduct(product));
  });
};
