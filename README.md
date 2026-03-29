# PPOB Backend Blueprint (TypeScript + MySQL + Redis)

Blueprint backend profesional untuk PPOB dengan pemisahan modul Website, User, dan Auth, autentikasi `x-api-key` (khusus user API) + JWT token (access/refresh), logger, dokumentasi API, serta skema database MySQL.

## Stack
- Node.js + TypeScript
- Express.js
- MySQL (`mysql2`)
- Redis (`ioredis`)
- Pino logger (`pino`, `pino-http`)
- OpenAPI docs (`swagger-ui-express`)
- Testing (`vitest`, `supertest`)

## Struktur Project

```bash
src/
  config/
  infrastructure/
  middlewares/
  modules/
    auth/
    website/
    user/
  routes/
  app.ts
  server.ts
docs/
  openapi.yaml
  website/api.md
  auth-api.md
  user/api.md
database/mysql/
  schema.sql
  seed.sql
test/
  app.test.ts
```

## Setup

1. Copy environment:
   ```bash
   cp .env.example .env
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build project:
   ```bash
   npm run build
   ```
4. Run development server:
   ```bash
   npm run dev
   ```

## Security Configuration
- Akses browser dari frontend (cross-origin) hanya dibuka saat `NODE_ENV=production`.
- Gunakan `CORS_ORIGIN` sebagai origin frontend yang diizinkan pada mode production.
- User API memakai `x-api-key` dari kolom `users.apikey` (bukan `USER_API_KEY` global di `.env`).
- Di environment `production`, nilai berikut wajib minimal 32 karakter:
  - `ACCESS_TOKEN_SECRET`
  - `REFRESH_TOKEN_SECRET`
- Server membatasi ukuran body request JSON/form hingga `10kb` untuk mengurangi risiko abuse payload besar.

## Endpoint Utama
- `GET /health`
- `GET /api/website/ping`
- `GET /api/website/products` (Bearer access token)
- `GET /api/website/akrab-products` (Bearer access token)
- `GET /api/user/ping`
- `GET /api/user/profile`
- `GET /api/akrab-products` (x-api-key user + IP whitelist `users.whitelistip`)
- `POST /api/auth/register`
- `POST /api/auth/verify-otp`
- `POST /api/auth/verify-mfa`
- `POST /api/auth/login`
- `POST /api/auth/refresh-token`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/google/register`
- `POST /api/auth/google/login`
- `GET /api/auth/me` (Bearer access token)
- `GET /api/auth/policy` (Bearer access token)
- `PATCH /api/auth/policy` (Bearer access token)
- `GET /api/auth/sessions` (Bearer access token)
- `DELETE /api/auth/sessions/:sessionId` (Bearer access token)
- `GET /api/auth/security-logs` (Bearer access token)
- `POST /api/website/order` (Bearer access token)
- `GET /docs`

## Dokumentasi Terpisah (.md)
- Website API: `docs/website/api.md`
- Auth API: `docs/auth-api.md`
- User API: `docs/user/api.md`

Catatan: User API digunakan oleh user untuk mengambil informasi akun dan disiapkan untuk endpoint transaksi pada pengembangan berikutnya.
Selain itu, access token hasil login/refresh disimpan sementara di Redis sesuai TTL token, dan endpoint website products membutuhkan header `Authorization: Bearer <access_token>`.

## Database
- Jalankan SQL schema: `database/mysql/schema.sql`
- Jalankan SQL seed: `database/mysql/seed.sql`
- Tabel utama blueprint:
  - `users` (dengan kolom `apikey` dan `avatar`)
  - `products`
  - `histories` (mencakup data transaksi seperti trx_id, invoice_no, product_name, amount, admin_fee, status)
  - `deposits`
  - `settings`

## Testing
```bash
npm run test
```
