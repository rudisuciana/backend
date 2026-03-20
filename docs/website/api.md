# Dokumentasi Website API

Dokumentasi ini khusus untuk endpoint channel **Website**.
Path Website dipisahkan di prefix **`/api/website/*`**.

## Base URL
- Local: `http://localhost:3000`

## Ringkasan Autentikasi
- `GET /api/website/ping` bersifat public.
- `GET /api/website/products` wajib access token (Bearer).
- `GET /api/website/akrab-products` wajib access token (Bearer).
- Access token didapat dari login Auth API (`/api/auth/login`, `/api/auth/google/login`, atau `/api/auth/verify-mfa`).
- Access token tervalidasi JWT **dan** cocok dengan cache Redis. Jika tidak cocok, request ditolak.

## Endpoint

### 1) GET `/api/website/ping`
Cek konektivitas channel website.

**Contoh Request**
```bash
curl --location 'http://localhost:3000/api/website/ping'
```

**Response sukses (200)**
```json
{
  "success": true,
  "message": "Website API reachable"
}
```

---

### 2) GET `/api/website/products`
Mengambil daftar produk PPOB aktif.

**Header Wajib**
- `Authorization: Bearer <ACCESS_TOKEN>`

**Contoh Request**
```bash
curl --location 'http://localhost:3000/api/website/products' \
  --header 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

**Response sukses (200)**
```json
{
  "success": true,
  "data": [
    {
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

**Response gagal (401) - header Authorization tidak ada**
```json
{
  "success": false,
  "message": "Authorization header is required"
}
```

**Response gagal (401) - format Authorization salah**
```json
{
  "success": false,
  "message": "Authorization must be Bearer token"
}
```

**Response gagal (401) - token invalid/expired/tidak ada di Redis**
```json
{
  "success": false,
  "message": "Invalid access token"
}
```

**Response gagal (429) - terlalu banyak request**
```json
{
  "success": false,
  "message": "Too many request for products, please try again later"
}
```

---

### 3) GET `/api/website/akrab-products`
Mengambil daftar produk agregasi Akrab untuk channel website.

**Header Wajib**
- `Authorization: Bearer <ACCESS_TOKEN>`

**Contoh Request**
```bash
curl --location 'http://localhost:3000/api/website/akrab-products' \
  --header 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

**Response sukses (200)**
```json
{
  "success": true,
  "data": [
    {
      "code": "AKRAB001",
      "name": "Akrab Product",
      "price": 12000,
      "stock": 100,
      "category": "Akrab Anggota",
      "description": ["Provider source"],
      "version": 1
    }
  ]
}
```

**Response gagal (401) - token invalid/expired**
```json
{
  "success": false,
  "message": "Invalid access token"
}
```

## Panduan Implementasi Frontend (Detail)

### A) Strategi penyimpanan token
1. Simpan `accessToken` di memory state aplikasi (lebih aman daripada localStorage).
2. Gunakan endpoint refresh token dari Auth API saat access token expired.
3. Setiap request ke `/api/website/products` harus mengirim header `Authorization: Bearer <accessToken>`.

### B) Alur request produk yang disarankan
1. User login.
2. Simpan `accessToken` hasil login.
3. Call `/api/website/products`.
4. Jika `401 Invalid access token`, jalankan flow refresh token.
5. Jika refresh sukses, ulangi request produk.
6. Jika refresh gagal, logout user dan arahkan ke halaman login.

### C) Handling error per status code
- `401`: trigger refresh/login ulang.
- `429`: tampilkan pesan throttling + retry dengan jeda (misal 30-60 detik).
- `5xx`: tampilkan fallback error UI dan tombol retry manual.

### D) UX yang direkomendasikan
- Tampilkan skeleton/loading saat fetch produk.
- Simpan hasil produk terakhir di state untuk menghindari flicker saat refetch.
- Gunakan retry terbatas (misal maksimal 2x) hanya untuk error jaringan, bukan untuk `401`.
