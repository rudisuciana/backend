import type { Pool, RowDataPacket } from 'mysql2/promise';
import type Redis from 'ioredis';

export interface PPOBProduct {
  id: number;
  code: string;
  name: string;
  category: string;
  price: number;
  adminFee: number;
  isActive: boolean;
}

interface ProductRow extends RowDataPacket {
  id: number;
  code: string;
  name: string;
  category: string;
  price: number;
  admin_fee: number;
  is_active: number;
}

export class WebsiteRepository {
  constructor(
    private readonly mysqlPool: Pool,
    private readonly redisClient: Redis
  ) {}

  async listProducts(): Promise<PPOBProduct[]> {
    const cacheKey = 'ppob:products:all';
    const cached = await this.redisClient.get(cacheKey);

    if (cached) {
      return JSON.parse(cached) as PPOBProduct[];
    }

    const [rows] = await this.mysqlPool.query<ProductRow[]>(
      `SELECT id, code, name, category, price, admin_fee, is_active
       FROM ppob_products
       WHERE is_active = 1
       ORDER BY id ASC`
    );

    const products = rows.map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      category: row.category,
      price: Number(row.price),
      adminFee: Number(row.admin_fee),
      isActive: row.is_active === 1
    }));

    await this.redisClient.set(cacheKey, JSON.stringify(products), 'EX', 60);
    return products;
  }
}
