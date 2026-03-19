# PPOB Backend Blueprint (TypeScript + MySQL + Redis)

Blueprint backend profesional untuk PPOB dengan pemisahan modul Website, User, dan Auth, autentikasi `x-api-key` + JWT token (access/refresh), logger, dokumentasi API, serta skema database MySQL.

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

## Endpoint Utama
- `GET /health`
- `GET /api/v1/website/ping`
- `GET /api/v1/website/products`
- `GET /api/v1/user/ping`
- `GET /api/v1/user/profile?userId=1`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/verify-otp`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh-token`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `POST /api/v1/auth/google/register`
- `POST /api/v1/auth/google/login`
- `GET /docs`

## Database
- Jalankan SQL schema: `database/mysql/schema.sql`
- Jalankan SQL seed: `database/mysql/seed.sql`
- Tabel utama blueprint:
  - `users` (dengan kolom `apikey`)
  - `products`
  - `histories` (mencakup data transaksi + riwayat aksi)
  - `deposits`
  - `settings`

## Testing
```bash
npm run test
```
