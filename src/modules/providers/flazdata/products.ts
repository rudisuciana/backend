interface FlazdataProductApiResponseItem {
  code?: unknown;
  name?: unknown;
  price?: unknown;
  stock?: unknown;
  description?: unknown;
}

interface FlazdataProductApiResponse {
  success?: unknown;
  data?: unknown;
}

export interface FlazdataProduct {
  code: string;
  name: string;
  price: number;
  stock: number;
  category: 'Akrab Anggota';
  description: string[];
  version: 1;
}

const getRequiredEnv = (key: 'FLAZ_URL' | 'FLAZ_API'): string => {
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

const normalizeResponseData = (value: unknown): FlazdataProductApiResponseItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value as FlazdataProductApiResponseItem[];
};

const mapProduct = (item: FlazdataProductApiResponseItem): FlazdataProduct => ({
  code: typeof item.code === 'string' ? item.code : '',
  name: typeof item.name === 'string' ? item.name : '',
  price: toNumber(item.price),
  stock: toNumber(item.stock),
  category: 'Akrab Anggota',
  description: toDescriptionList(item.description),
  version: 1
});

export const getFlazdataProducts = async (): Promise<FlazdataProduct[]> => {
  const baseUrl = getRequiredEnv('FLAZ_URL').replace(/\/+$/, '');
  const apiKey = getRequiredEnv('FLAZ_API');

  const response = await fetch(`${baseUrl}/mpa/product-stock`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey
    }
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as FlazdataProductApiResponse;
  if (payload.success !== true) {
    return [];
  }

  return normalizeResponseData(payload.data).map(mapProduct);
};
