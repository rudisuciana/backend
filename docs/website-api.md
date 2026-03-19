# Dokumentasi Website API

Dokumentasi ini khusus untuk endpoint channel **Website**.

## Base URL
- Local: `http://localhost:3000`

## Autentikasi
Semua endpoint website wajib header:

- `x-api-key: <WEBSITE_API_KEY>`

## Endpoint

### 1) GET `/api/v1/website/ping`
Cek konektivitas channel website.

**Contoh Request**
```bash
curl --location 'http://localhost:3000/api/v1/website/ping' \
  --header 'x-api-key: website-secret-key'
```

**Response 200**
```json
{
  "success": true,
  "message": "Website API reachable"
}
```

### 2) GET `/api/v1/website/products`
Mengambil daftar produk PPOB aktif.

**Contoh Request**
```bash
curl --location 'http://localhost:3000/api/v1/website/products' \
  --header 'x-api-key: website-secret-key'
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

**Response 401 - x-api-key tidak dikirim**
```json
{
  "success": false,
  "message": "Missing x-api-key header"
}
```

**Response 403 - x-api-key tidak valid**
```json
{
  "success": false,
  "message": "Invalid x-api-key"
}
```
