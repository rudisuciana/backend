# Dokumentasi Website API

Dokumentasi ini khusus untuk endpoint channel **Website**.

## Base URL
- Local: `http://localhost:3000`

## Autentikasi
Endpoint website **tidak memerlukan** header `x-api-key`.

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
Mengambil daftar produk PPOB aktif.

**Contoh Request**
```bash
curl --location 'http://localhost:3000/api/v1/website/products' \
  --header 'Content-Type: application/json'
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
Untuk endpoint website, error `401/403` terkait `x-api-key` tidak berlaku karena endpoint ini bersifat public.
