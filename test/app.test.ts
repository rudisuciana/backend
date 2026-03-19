import request from 'supertest';
import { describe, expect, it } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.WEBSITE_API_KEY = 'website-secret-key';
process.env.USER_API_KEY = 'user-secret-key';
process.env.CORS_ORIGIN = 'http://localhost:3000';

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

  it('should not echo non-whitelisted CORS origin', async () => {
    const response = await request(app)
      .get('/api/v1/website/ping')
      .set('x-api-key', 'website-secret-key')
      .set('Origin', 'https://malicious.example');

    expect(response.headers['access-control-allow-origin']).not.toBe('https://malicious.example');
  });

  it('should reject oversized JSON payload', async () => {
    const response = await request(app).post('/api/v1/auth/register').send({
      email: `a${'a'.repeat(12000)}@example.com`,
      password: 'Password123!',
      name: 'Big Payload User',
      phone: '081234567890',
      username: 'bigpayload'
    });

    expect(response.status).toBe(413);
  });
});
