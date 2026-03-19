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
  website-api.md
  user-api.md
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
- `GET /api/v1/website/ping`
- `GET /api/v1/website/products`
- `GET /api/v1/user/ping`
- `GET /api/v1/user/profile`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/verify-otp`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh-token`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `POST /api/v1/auth/google/register`
- `POST /api/v1/auth/google/login`
- `GET /docs`

## Dokumentasi Terpisah (.md)
- Website API: `docs/website-api.md`
- User API: `docs/user-api.md`

Catatan: User API digunakan oleh user untuk mengambil informasi akun dan dipersiapkan untuk endpoint transaksi pada pengembangan berikutnya.

## Database
- Jalankan SQL schema: `database/mysql/schema.sql`
- Jalankan SQL seed: `database/mysql/seed.sql`
- Tabel utama blueprint:
  - `users` (dengan kolom `apikey` dan `avatar`)
  - `products`
  - `histories` (mencakup data transaksi + riwayat aksi)
  - `deposits`
  - `settings`

## Testing
```bash
npm run test
```
