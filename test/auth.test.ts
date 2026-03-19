import request from 'supertest';
import { describe, expect, it } from 'vitest';

process.env.NODE_ENV = 'test';

import { createApp } from '../src/app';

const app = createApp();

describe('Auth API validation', () => {
  it('should validate register payload', async () => {
    const response = await request(app).post('/api/auth/register').send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('should reject register payload for non-gmail email domain', async () => {
    const response = await request(app).post('/api/auth/register').send({
      username: 'regularuser',
      email: 'user@yahoo.com',
      phone: '081234567890',
      password: 'Password123!'
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('should validate login payload', async () => {
    const response = await request(app).post('/api/auth/login').send({
      identity: '',
      password: 'short'
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('should validate verify-otp payload', async () => {
    const response = await request(app).post('/api/auth/verify-otp').send({
      email: 'invalid',
      otp: '12'
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('should validate forgot-password payload', async () => {
    const response = await request(app).post('/api/auth/forgot-password').send({
      email: 'invalid'
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('should validate refresh-token payload', async () => {
    const response = await request(app).post('/api/auth/refresh-token').send({
      refreshToken: 'short'
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('should require csrf token when refresh-token uses cookie-based auth', async () => {
    const response = await request(app)
      .post('/api/auth/refresh-token')
      .set('Cookie', ['refresh_token=longenoughtokenlongenoughtoken'])
      .send({});

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  it('should validate logout payload', async () => {
    const response = await request(app).post('/api/auth/logout').send({
      refreshToken: 'short'
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('should require csrf token when logout uses cookie-based auth', async () => {
    const response = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', ['refresh_token=longenoughtokenlongenoughtoken'])
      .send({});

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  it('should validate google login payload', async () => {
    const response = await request(app).post('/api/auth/google/login').send({
      idToken: 'short'
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
