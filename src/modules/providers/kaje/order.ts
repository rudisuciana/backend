import { detectProvider, normalizeNumber, orderId } from '../../../utils/helpers';

interface KajeOrderRequest {
  number: string;
  code: string;
}

interface KajeOrderApiResponseData {
  status?: unknown;
  ref_id?: unknown;
  trx_id?: unknown;
  destination?: unknown;
  message?: unknown;
}

interface KajeOrderApiResponse {
  success?: unknown;
  data?: unknown;
}

export interface KajeOrderResult {
  trx_id: string;
  invoice_no: string;
  product_id: string;
  number: string;
  status: string;
  description: string;
}

const getRequiredEnv = (key: 'KAJE_URL' | 'KAJE_API'): string => {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`${key}_IS_REQUIRED`);
  }
  return value;
};

const toStringValue = (value: unknown): string => (typeof value === 'string' ? value : '');

const isAllowedProvider = (provider: string): boolean =>
  provider === 'XL' || provider === 'AXIS' || provider === 'SMARTFREND';

export const createKajeOrder = async (input: KajeOrderRequest): Promise<KajeOrderResult> => {
  const normalized = normalizeNumber(input.number);
  const provider = detectProvider(normalized);

  if (!isAllowedProvider(provider)) {
    throw new Error('UNSUPPORTED_PROVIDER');
  }

  const baseUrl = getRequiredEnv('KAJE_URL').replace(/\/+$/, '');
  const apiKey = getRequiredEnv('KAJE_API');
  const refId = orderId();

  const response = await fetch(`${baseUrl}/service/order-product`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    },
    body: JSON.stringify({
      destination: normalized,
      ref_id: refId,
      code: input.code
    })
  });

  const payload = (await response.json()) as KajeOrderApiResponse;
  if (!response.ok || payload.success !== true) {
    throw new Error('KAJE_ORDER_FAILED');
  }

  const data = payload.data as KajeOrderApiResponseData | undefined;
  return {
    trx_id: toStringValue(data?.trx_id),
    invoice_no: toStringValue(data?.ref_id),
    product_id: input.code,
    number: toStringValue(data?.destination),
    status: toStringValue(data?.status),
    description: toStringValue(data?.message)
  };
};
