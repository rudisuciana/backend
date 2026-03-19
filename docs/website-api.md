# Dokumentasi Website API

## Autentikasi
Semua endpoint website wajib header:

- `x-api-key: <WEBSITE_API_KEY>`

## Endpoint

### 1) GET `/api/v1/website/ping`
Cek konektivitas channel website.

**Response 200**
```json
{
  "success": true,
  "message": "Website API reachable"
}
```

### 2) GET `/api/v1/website/products`
Mengambil daftar produk PPOB aktif.

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
