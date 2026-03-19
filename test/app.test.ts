import request from 'supertest';
import { describe, expect, it } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.WEBSITE_API_KEY = 'website-secret-key';
process.env.USER_API_KEY = 'user-secret-key';

import { createApp } from '../src/app';

const app = createApp();

describe('PPOB backend blueprint', () => {
  it('should reject website route without x-api-key', async () => {
    const response = await request(app).get('/api/v1/website/ping');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it('should reject website route with invalid x-api-key', async () => {
    const response = await request(app)
      .get('/api/v1/website/ping')
      .set('x-api-key', 'wrong-key');

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  it('should accept website route with valid x-api-key', async () => {
    const response = await request(app)
      .get('/api/v1/website/ping')
      .set('x-api-key', 'website-secret-key');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('should accept user route with valid x-api-key', async () => {
    const response = await request(app)
      .get('/api/v1/user/ping')
      .set('x-api-key', 'user-secret-key');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
