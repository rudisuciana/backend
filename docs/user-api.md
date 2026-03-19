# Dokumentasi User API

## Autentikasi
Semua endpoint user wajib header:

- `x-api-key: <USER_API_KEY>`

## Endpoint

### 1) GET `/api/v1/user/ping`
Cek konektivitas channel user.

**Response 200**
```json
{
  "success": true,
  "message": "User API reachable"
}
```

### 2) GET `/api/v1/user/profile?userId=1`
Mengambil profil user berdasarkan ID.

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
