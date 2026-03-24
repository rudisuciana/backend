import type { RowDataPacket } from 'mysql2/promise';
import { getMySQLPool } from '../../../infrastructure/mysql';

interface KhfyStockApiResponseItem {
  type?: unknown;
  sisa_slot?: unknown;
}

interface KhfyStockApiResponse {
  ok?: unknown;
  data?: unknown;
}

interface AkrabRow extends RowDataPacket {
  code: string;
  name: string;
  price: unknown;
  category: string;
  description: unknown;
}

export interface KhfyProduct {
  code: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  description: string[];
  version: 3;
}

const KHFY_STOCK_URL = 'https://panel.khfy-store.com/api_v3/cek_stock_akrab';

const toNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
};

const toDescriptionList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string');
      }
    } catch {
      return [];
    }
  }

  return [];
};

const normalizeStockItems = (value: unknown): KhfyStockApiResponseItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value as KhfyStockApiResponseItem[];
};

export const getKhfyProducts = async (): Promise<KhfyProduct[]> => {
  const response = await fetch(KHFY_STOCK_URL, {
    method: 'GET'
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as KhfyStockApiResponse;
  if (payload.ok !== true) {
    return [];
  }

  const stockItems = normalizeStockItems(payload.data).map((item) => ({
    code: typeof item.type === 'string' ? item.type : '',
    stock: toNumber(item.sisa_slot)
  }));

  const codes = stockItems.map((item) => item.code).filter(Boolean);
  if (codes.length === 0) {
    return [];
  }

  const mysqlPool = getMySQLPool();
  const placeholders = codes.map(() => '?').join(', ');
  const [rows] = await mysqlPool.query<AkrabRow[]>(
    `SELECT code, name, price, category, description
     FROM akrab
     WHERE code IN (${placeholders})`,
    codes
  );

  const akrabByCode = new Map(
    rows.map((row) => [
      row.code,
      {
        code: row.code,
        name: row.name,
        price: toNumber(row.price),
        category: row.category,
        description: toDescriptionList(row.description)
      }
    ])
  );

  return stockItems
    .map((item) => {
      const akrab = akrabByCode.get(item.code);
      if (!akrab) {
        return null;
      }

      return {
        code: akrab.code,
        name: akrab.name,
        price: akrab.price,
        stock: item.stock,
        category: akrab.category,
        description: akrab.description,
        version: 3 as const
      };
    })
    .filter((item): item is KhfyProduct => item !== null);
};
