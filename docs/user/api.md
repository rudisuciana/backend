# Dokumentasi User API

Dokumentasi ini khusus untuk endpoint channel **User**.
Path User dipisahkan di prefix **`/api/user/*`**.

## Base URL
- Local: `http://localhost:3000`

## Ringkasan Autentikasi
Semua endpoint user wajib:
- `x-api-key: <USER_API_KEY>`
- API key harus cocok dengan `users.apikey`.
- IP request harus ada di whitelist `users.whitelistip` untuk API key tersebut.
- Jika `whitelistip` berisi banyak IP, pisahkan dengan koma (`,`), contoh: `127.0.0.1,::ffff:127.0.0.1`.

## Endpoint

### 1) GET `/api/user/ping`
Cek konektivitas channel user.

**Contoh Request**
```bash
curl --location 'http://localhost:3000/api/user/ping' \
  --header 'x-api-key: YOUR_API_KEY_HERE'
```

**Response sukses (200)**
```json
{
  "success": true,
  "message": "User API reachable"
}
```

---

### 2) GET `/api/user/profile`
Mengambil profile user berdasarkan pemilik `x-api-key`.

**Contoh Request**
```bash
curl --location 'http://localhost:3000/api/user/profile' \
  --header 'x-api-key: YOUR_API_KEY_HERE'
```

**Response sukses (200)**
```json
{
  "success": true,
  "data": {
    "name": "Demo User",
    "email": "demo@example.com",
    "balance": 500000,
    "status": "active",
    "avatar": "https://example.com/avatar.png"
  }
}
```

**Response gagal (401) - x-api-key tidak dikirim**
```json
{
  "success": false,
  "message": "x-api-key header is required"
}
```

**Response gagal (403) - IP tidak sesuai whitelist / API key tidak memiliki whitelist aktif**
```json
{
  "success": false,
  "message": "IP is not allowed"
}
```

**Response gagal (404) - profile user tidak ditemukan**
```json
{
  "success": false,
  "message": "User not found"
}
```

**Response gagal (429) - terlalu banyak request**
```json
{
  "success": false,
  "message": "Too many user requests, please try again later"
}
```

## Panduan Implementasi Frontend (Detail)

### A) Penyimpanan API key
1. Jangan hardcode API key di source code.
2. Ambil API key dari secure backend/session management frontend.
3. Set API key sebagai header default untuk seluruh request `/api/user/*`.

### B) Alur akses profile yang disarankan
1. Setelah user login di aplikasi Anda, ambil/resolve API key user.
2. Panggil `GET /api/user/profile` dengan `x-api-key`.
3. Simpan profile ke state global.
4. Lakukan refetch saat user kembali ke halaman profile atau setelah transaksi sukses.

### C) Handling error per status code
- `401`: anggap API key belum ada/expired di sisi aplikasi, paksa re-auth flow.
- `403`: tampilkan pesan “akses dari IP ini tidak diizinkan”.
- `404`: tampilkan state “akun tidak ditemukan”.
- `429`: tampilkan rate-limit message dan retry dengan backoff.

### D) Rekomendasi keamanan frontend
- Jangan log API key ke console/telemetry.
- Masking API key jika harus ditampilkan untuk debugging internal.
- Batasi akses halaman profile dengan session guard agar request tidak dipanggil saat user anonim.
