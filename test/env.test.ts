import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ORIGINAL_ENV = { ...process.env };

const loadEnvConfig = async () => {
  vi.resetModules();
  return import('../src/config/env');
};

describe('env config security', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('should throw in production when key and secret lengths are below minimum', async () => {
    process.env.NODE_ENV = 'production';
    process.env.WEBSITE_API_KEY = 'short';
    process.env.USER_API_KEY = 'short';
    process.env.ACCESS_TOKEN_SECRET = 'short';
    process.env.REFRESH_TOKEN_SECRET = 'short';

    await expect(loadEnvConfig()).rejects.toThrow(
      'Production requires WEBSITE_API_KEY, USER_API_KEY, ACCESS_TOKEN_SECRET, and REFRESH_TOKEN_SECRET with minimum length 32 characters'
    );
  });

  it('should not throw in production when key and secret lengths meet minimum', async () => {
    process.env.NODE_ENV = 'production';
    process.env.WEBSITE_API_KEY = 'w'.repeat(32);
    process.env.USER_API_KEY = 'u'.repeat(32);
    process.env.ACCESS_TOKEN_SECRET = 'a'.repeat(32);
    process.env.REFRESH_TOKEN_SECRET = 'r'.repeat(32);

    await expect(loadEnvConfig()).resolves.toBeDefined();
  });
});
