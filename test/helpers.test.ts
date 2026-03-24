import { describe, expect, it, vi } from 'vitest';
import { depositId, detectProvider, generateTimestamp, normalizeNumber, orderId } from '../src/utils/helpers';

describe('helpers', () => {
  it('should generate numeric timestamp', () => {
    const value = generateTimestamp();
    expect(value).toMatch(/^\d+$/);
  });

  it('should normalize phone number to 08 format', () => {
    expect(normalizeNumber('+628123456789')).toBe('08123456789');
    expect(normalizeNumber('628123456789')).toBe('08123456789');
    expect(normalizeNumber('8123456789')).toBe('08123456789');
    expect(normalizeNumber('0812-3456-789')).toBe('08123456789');
  });

  it('should detect provider from normalized number', () => {
    expect(detectProvider('081712345678')).toBe('XL');
    expect(detectProvider('083112345678')).toBe('AXIS');
    expect(detectProvider('088112345678')).toBe('SMARTFREND');
    expect(detectProvider('089612345678')).toBe('TRI');
    expect(detectProvider('081312345678')).toBe('TELKOMSEL');
    expect(detectProvider('085612345678')).toBe('INDOSAT');
    expect(detectProvider('085154123456')).toBe('BYU');
    expect(detectProvider('080000000000')).toBe('UNKNOWN');
  });

  it('should build order id with ORDER prefix and timestamp', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);
    expect(orderId()).toBe('ORDER1700000000000');
    vi.restoreAllMocks();
  });

  it('should build deposit id with TOPUP prefix and timestamp', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000001);
    expect(depositId()).toBe('TOPUP1700000000001');
    vi.restoreAllMocks();
  });
});
