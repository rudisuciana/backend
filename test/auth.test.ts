import request from 'supertest';
import { describe, expect, it } from 'vitest';

process.env.NODE_ENV = 'test';

import { createApp } from '../src/app';

const app = createApp();

describe('Auth API validation', () => {
  it('should validate register payload', async () => {
    const response = await request(app).post('/api/v1/auth/register').send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('should reject register payload for non-gmail email domain', async () => {
    const response = await request(app).post('/api/v1/auth/register').send({
      username: 'regularuser',
      email: 'user@yahoo.com',
      phone: '081234567890',
      password: 'Password123!'
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('should validate login payload', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({
      identity: '',
      password: 'short'
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('should validate verify-otp payload', async () => {
    const response = await request(app).post('/api/v1/auth/verify-otp').send({
      email: 'invalid',
      otp: '12'
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('should validate forgot-password payload', async () => {
    const response = await request(app).post('/api/v1/auth/forgot-password').send({
      email: 'invalid'
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('should validate refresh-token payload', async () => {
    const response = await request(app).post('/api/v1/auth/refresh-token').send({
      refreshToken: 'short'
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('should validate google login payload', async () => {
    const response = await request(app).post('/api/v1/auth/google/login').send({
      idToken: 'short'
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
