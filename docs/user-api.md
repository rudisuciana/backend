# Dokumentasi User API

Dokumentasi ini khusus untuk endpoint channel **User**.
Channel ini dipakai user untuk mengambil informasi akun, dan akan dipakai juga untuk fitur transaksi berikutnya.

## Base URL
- Local: `http://localhost:3000`

## Autentikasi
Semua endpoint user wajib:

- `x-api-key: YOUR_API_KEY_HERE`
- Ganti `YOUR_API_KEY_HERE` dengan API key asli milik user dari kolom `users.apikey`.
- IP request harus ada di kolom `users.whitelistip` milik user yang terkait dengan `x-api-key`.
- Jika `whitelistip` berisi banyak IP, pisahkan dengan koma `,` (contoh: `127.0.0.1,::ffff:127.0.0.1`).

## Endpoint

### 1) GET `/api/user/ping`
Cek konektivitas channel user.

**Contoh Request**
```bash
curl --location 'http://localhost:3000/api/user/ping' \
  --header 'x-api-key: YOUR_API_KEY_HERE'
```

**Response 200**
```json
{
  "success": true,
  "message": "User API reachable"
}
```

### 2) GET `/api/user/profile`
Mengambil informasi akun user berdasarkan `x-api-key` milik user yang sedang mengakses (siap dipakai sebagai data awal transaksi).

**Contoh Request**
```bash
curl --location 'http://localhost:3000/api/user/profile' \
  --header 'x-api-key: YOUR_API_KEY_HERE'
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
    "status": "active",
    "avatar": "https://example.com/avatars/demo-user.png"
  }
}
```

## Error Umum

**Response 401 - x-api-key tidak dikirim**
```json
{
  "success": false,
  "message": "x-api-key header is required"
}
```

**Response 403 - x-api-key tidak valid**
```json
{
  "success": false,
  "message": "Invalid API key"
}
```

**Response 403 - IP tidak termasuk whitelist**
```json
{
  "success": false,
  "message": "IP is not allowed"
}
```
