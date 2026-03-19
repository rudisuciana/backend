interface KajeProductApiResponseItem {
  code?: unknown;
  name?: unknown;
  price?: unknown;
  stock?: unknown;
  category?: unknown;
  description?: unknown;
}

interface KajeProductApiResponseData {
  products?: unknown;
}

interface KajeProductApiResponse {
  success?: unknown;
  data?: unknown;
}

export interface KajeProduct {
  code: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  description: string[];
  version: 2;
}

const getRequiredEnv = (key: 'KAJE_URL' | 'KAJE_API'): string => {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`${key}_IS_REQUIRED`);
  }
  return value;
};

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
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
};

const normalizeProducts = (value: unknown): KajeProductApiResponseItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value as KajeProductApiResponseItem[];
};

const mapProduct = (item: KajeProductApiResponseItem): KajeProduct => ({
  code: typeof item.code === 'string' ? item.code : '',
  name: typeof item.name === 'string' ? item.name : '',
  price: toNumber(item.price),
  stock: toNumber(item.stock),
  category: typeof item.category === 'string' ? item.category : '',
  description: toDescriptionList(item.description),
  version: 2
});

export const getKajeProducts = async (): Promise<KajeProduct[]> => {
  const baseUrl = getRequiredEnv('KAJE_URL').replace(/\/+$/, '');
  const apiKey = getRequiredEnv('KAJE_API');

  const response = await fetch(`${baseUrl}/service/list-product`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey
    }
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as KajeProductApiResponse;
  if (payload.success !== true) {
    return [];
  }

  const data = payload.data as KajeProductApiResponseData | undefined;
  return normalizeProducts(data?.products).map(mapProduct);
};
