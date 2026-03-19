# Dokumentasi User API

Dokumentasi ini khusus untuk endpoint channel **User**.

## Base URL
- Local: `http://localhost:3000`

## Autentikasi
Semua endpoint user wajib header:

- `x-api-key: <USER_API_KEY>`

## Endpoint

### 1) GET `/api/v1/user/ping`
Cek konektivitas channel user.

**Contoh Request**
```bash
curl --location 'http://localhost:3000/api/v1/user/ping' \
  --header 'x-api-key: user-secret-key'
```

**Response 200**
```json
{
  "success": true,
  "message": "User API reachable"
}
```

### 2) GET `/api/v1/user/profile?userId=1`
Mengambil profil user berdasarkan ID.

**Contoh Request**
```bash
curl --location 'http://localhost:3000/api/v1/user/profile?userId=1' \
  --header 'x-api-key: user-secret-key'
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Demo User",
    "email": "demo@example.com",
    "balance": 500000,
    "status": "active"
  }
}
```

**Response 400**
```json
{
  "success": false,
  "message": "Invalid query parameter userId"
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
