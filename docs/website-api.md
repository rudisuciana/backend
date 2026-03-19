# Dokumentasi Website API

Dokumentasi ini khusus untuk endpoint channel **Website**.

## Base URL
- Local: `http://localhost:3000`

## Autentikasi
- `GET /api/v1/website/ping` bersifat public.
- `GET /api/v1/website/products` membutuhkan login user terlebih dahulu.
- Gunakan header:
  - `Authorization: Bearer YOUR_ACCESS_TOKEN`
  - Access token didapat dari endpoint login (`/api/v1/auth/login` atau Google login) dan disimpan sementara di Redis.

## Endpoint

### 1) GET `/api/v1/website/ping`
Cek konektivitas channel website.

**Contoh Request**
```bash
curl --location 'http://localhost:3000/api/v1/website/ping' \
  --header 'Content-Type: application/json'
```

**Response 200**
```json
{
  "success": true,
  "message": "Website API reachable"
}
```

### 2) GET `/api/v1/website/products`
Mengambil daftar produk PPOB aktif (hanya untuk user yang sudah login).

**Contoh Request**
```bash
curl --location 'http://localhost:3000/api/v1/website/products' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "PLN20",
      "name": "Token PLN 20.000",
      "category": "electricity",
      "price": 20500,
      "adminFee": 2500,
      "isActive": true
    }
  ]
}
```

## Error Umum
- Endpoint website tidak memakai `x-api-key`.
- Endpoint `/api/v1/website/products` dapat mengembalikan `401` jika:
  - header Authorization tidak ada
  - format bukan Bearer token
  - access token tidak valid / tidak ditemukan di Redis
