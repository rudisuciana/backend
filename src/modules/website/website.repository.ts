import type { Pool, RowDataPacket } from 'mysql2/promise';
import type { ResultSetHeader } from 'mysql2';
import type Redis from 'ioredis';

export interface PPOBProduct {
  code: string;
  name: string;
  category: string;
  price: number;
  adminFee: number;
  isActive: boolean;
}

export interface HistoryOrderInput {
  trxId: string;
  invoiceNo: string;
  userId: number;
  productCode: string;
  productName: string;
  amount: number;
  adminFee: number;
  number: string;
  status: string;
  description: string;
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

interface ProductPriceRow extends RowDataPacket {
  code: string;
  name: string;
  price: number;
  admin_fee: number;
}

export class WebsiteRepository {
  constructor(
    private readonly mysqlPool: Pool,
    private readonly redisClient: Redis
  ) {}

  async listProducts(): Promise<PPOBProduct[]> {
    const cacheKey = 'ppob:products:all';
    let cached: string | null = null;
    try {
      cached = await this.redisClient.get(cacheKey);
    } catch {
      cached = null;
    }

    if (cached) {
      try {
        return JSON.parse(cached) as PPOBProduct[];
      } catch {
        try {
          await this.redisClient.del(cacheKey);
        } catch {
          // ignore cache delete failures
        }
      }
    }

    const [rows] = await this.mysqlPool.query<ProductRow[]>(
      `SELECT id, code, name, category, price, admin_fee, is_active
       FROM products
       WHERE is_active = 1
       ORDER BY id ASC`
    );

    const products = rows.map((row) => ({
      code: row.code,
      name: row.name,
      category: row.category,
      price: Number(row.price),
      adminFee: Number(row.admin_fee),
      isActive: row.is_active === 1
    }));

    try {
      await this.redisClient.set(cacheKey, JSON.stringify(products), 'EX', 60);
    } catch {
      // ignore cache set failures
    }
    return products;
  }

  async getProductByCode(code: string): Promise<ProductPriceRow | null> {
    const [rows] = await this.mysqlPool.query<ProductPriceRow[]>(
      `SELECT code, name, price, admin_fee
       FROM products
       WHERE code = ?
       LIMIT 1`,
      [code]
    );

    if (!rows.length) {
      return null;
    }

    return rows[0];
  }

  async createHistoryOrder(input: HistoryOrderInput): Promise<void> {
    const [result] = await this.mysqlPool.query<ResultSetHeader>(
      `INSERT INTO histories
         (trx_id, invoice_no, user_id, product_id, product_name, amount, admin_fee, status, description)
       SELECT ?, ?, ?, id, ?, ?, ?, ?, ?
       FROM products
       WHERE code = ?
       LIMIT 1`,
      [
        input.trxId,
        input.invoiceNo,
        input.userId,
        input.productName,
        input.amount,
        input.adminFee,
        input.status,
        `${input.description} (${input.number})`,
        input.productCode
      ]
    );

    if (result.affectedRows === 0) {
      throw new Error('PRODUCT_NOT_FOUND');
    }
  }
}
