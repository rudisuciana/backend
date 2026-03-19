# Dokumentasi Website API

Dokumentasi ini khusus untuk endpoint channel **Website**.

## Base URL
- Local: `http://localhost:3000`

## Autentikasi
- `GET /api/website/ping` bersifat public.
- `GET /api/website/products` membutuhkan login user terlebih dahulu.
- Gunakan header:
  - `Authorization: Bearer YOUR_ACCESS_TOKEN`
  - Access token didapat dari endpoint login (`/api/auth/login` atau Google login) dan disimpan sementara di Redis.

## Endpoint

### 1) GET `/api/website/ping`
Cek konektivitas channel website.

**Contoh Request**
```bash
curl --location 'http://localhost:3000/api/website/ping' \
  --header 'Content-Type: application/json'
```

**Response 200**
```json
{
  "success": true,
  "message": "Website API reachable"
}
```

### 2) GET `/api/website/products`
Mengambil daftar produk PPOB aktif (hanya untuk user yang sudah login).

**Contoh Request**
```bash
curl --location 'http://localhost:3000/api/website/products' \
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
- Endpoint `/api/website/products` dapat mengembalikan `401` jika:
  - header Authorization tidak ada
  - format bukan Bearer token
  - access token tidak valid / tidak ditemukan di Redis
