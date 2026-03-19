import request from 'supertest';
import { describe, expect, it } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.CORS_ORIGIN = 'http://localhost:3000';

import { createApp } from '../src/app';

const app = createApp();

describe('PPOB backend blueprint', () => {
  it('should accept website route without x-api-key', async () => {
    const response = await request(app).get('/api/website/ping');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('should accept website route with any x-api-key', async () => {
    const response = await request(app)
      .get('/api/website/ping')
      .set('x-api-key', 'wrong-key');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('should disable CORS in non-production environment', async () => {
    const response = await request(app).get('/api/website/ping').set('Origin', 'https://malicious.example');

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('should reject website products route without bearer access token', async () => {
    const response = await request(app).get('/api/website/products');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it('should reject oversized JSON payload', async () => {
    const response = await request(app).post('/api/auth/register').send({
      email: `a${'a'.repeat(12000)}@example.com`,
      password: 'Password123!',
      name: 'Big Payload User',
      phone: '081234567890',
      username: 'bigpayload'
    });

    expect(response.status).toBe(413);
  });
});
