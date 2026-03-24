export type ProviderName =
  | 'XL'
  | 'AXIS'
  | 'SMARTFREND'
  | 'TRI'
  | 'TELKOMSEL'
  | 'INDOSAT'
  | 'BYU'
  | 'UNKNOWN';

const PROVIDER_PREFIXES: Array<{ provider: ProviderName; prefixes: string[] }> = [
  { provider: 'BYU', prefixes: ['085154', '085155', '085156', '085157', '085158'] },
  { provider: 'TELKOMSEL', prefixes: ['0811', '0812', '0813', '0821', '0822', '0823', '0851', '0852', '0853'] },
  { provider: 'INDOSAT', prefixes: ['0814', '0815', '0816', '0855', '0856', '0857', '0858'] },
  { provider: 'XL', prefixes: ['0817', '0818', '0819', '0859', '0877', '0878'] },
  { provider: 'AXIS', prefixes: ['0831', '0832', '0833', '0838'] },
  { provider: 'TRI', prefixes: ['0895', '0896', '0897', '0898', '0899'] },
  { provider: 'SMARTFREND', prefixes: ['0881', '0882', '0883', '0884', '0885', '0886', '0887', '0888', '0889'] }
];

export const generateTimestamp = (): string => Date.now().toString();

export const normalizeNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (!digits) {
    return '';
  }

  if (digits.startsWith('62')) {
    return `0${digits.slice(2)}`;
  }

  if (digits.startsWith('8')) {
    return `0${digits}`;
  }

  return digits;
};

export const detectProvider = (value: string): ProviderName => {
  const normalized = normalizeNumber(value);

  for (const item of PROVIDER_PREFIXES) {
    if (item.prefixes.some((prefix) => normalized.startsWith(prefix))) {
      return item.provider;
    }
  }

  return 'UNKNOWN';
};

export const orderId = (): string => `ORDER${generateTimestamp()}`;

export const depositId = (): string => `TOPUP${generateTimestamp()}`;
