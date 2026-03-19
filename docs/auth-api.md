# Dokumentasi Auth API

Dokumentasi ini khusus untuk endpoint channel **Auth**.
Channel ini dipakai untuk registrasi, login, verifikasi OTP, refresh token, reset password, serta operasional governance (kebijakan auth, manajemen sesi, dan audit log keamanan).

## Base URL
- Local: `http://localhost:3000`

## Catatan Autentikasi
- Endpoint di channel auth **tidak memakai** `x-api-key`.
- Hasil login mengembalikan:
  - `accessToken` (JWT, disimpan sementara di Redis sesuai TTL)
  - `refreshToken` (JWT, dipakai untuk minta access token baru)
- Backend juga mengirim `refresh_token` (HttpOnly cookie) dan `csrf_token` cookie untuk alur cookie-based auth.
- Hasil refresh mengembalikan `accessToken` **dan** `refreshToken` baru (refresh rotation).
- Jika akun mengaktifkan MFA (`mfa_enabled = 1`), login password akan mengembalikan status `202` dan OTP MFA dikirim ke email.
- Database `users.multilogin` mengatur multi device login:
  - `true` (default): multi login diizinkan.
  - `false`: sesi refresh lama akan dicabut saat login/MFA verify berhasil.
- Proteksi brute-force: akun akan terkunci sementara setelah beberapa kegagalan login berturut-turut.
- Untuk akses endpoint produk website gunakan:
  - `Authorization: Bearer <accessToken>`

## Endpoint

### 1) POST `/api/auth/register`
Registrasi manual user (khusus email domain Gmail), lalu kirim OTP ke email.

**Body Request**
```json
{
  "username": "demouser",
  "email": "demouser@gmail.com",
  "phone": "081234567890",
  "password": "Password123!"
}
```

**Response 201**
```json
{
  "success": true,
  "message": "Registration successful, OTP sent to email",
  "data": {
    "userId": 1,
    "email": "demouser@gmail.com"
  }
}
```

### 2) POST `/api/auth/verify-otp`
Verifikasi OTP hasil registrasi manual.

**Body Request**
```json
{
  "email": "demouser@gmail.com",
  "otp": "123456"
}
```

**Response 200**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

### 3) POST `/api/auth/login`
Login menggunakan `email` atau `username` + `password`.

**Body Request**
```json
{
  "identity": "demouser@gmail.com",
  "password": "Password123!"
}
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "accessToken": "<ACCESS_TOKEN>",
    "refreshToken": "<REFRESH_TOKEN>"
  }
}
```

### 4) POST `/api/auth/refresh-token`
Membuat access token baru menggunakan refresh token dan merotasi refresh token (token lama tidak berlaku lagi).

Anda bisa kirim refresh token lewat:
- body `refreshToken` (kompatibilitas lama), atau
- cookie HttpOnly `refresh_token` (disarankan). Untuk mode cookie wajib header `x-csrf-token` yang nilainya sama dengan cookie `csrf_token`.

**Body Request**
```json
{
  "refreshToken": "<REFRESH_TOKEN>"
}
```


### 4b) POST `/api/auth/verify-mfa`
Verifikasi OTP MFA setelah login mengembalikan status `202`.

**Body Request**
```json
{
  "email": "demouser@gmail.com",
  "otp": "123456"
}
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "accessToken": "<ACCESS_TOKEN>",
    "refreshToken": "<REFRESH_TOKEN>"
  }
}
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "accessToken": "<NEW_ACCESS_TOKEN>",
    "refreshToken": "<NEW_REFRESH_TOKEN>"
  }
}
```


### 5) POST `/api/auth/logout`
Logout user dengan menghapus sesi refresh token di server (refresh hash + refresh expiry di database akan dikosongkan).

Anda bisa kirim refresh token lewat body atau cookie `refresh_token` (mode cookie wajib `x-csrf-token`).

**Body Request**
```json
{
  "refreshToken": "<REFRESH_TOKEN>"
}
```

**Response 200**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### 6) POST `/api/auth/forgot-password`
Kirim OTP reset password ke email user (jika email terdaftar).

**Body Request**
```json
{
  "email": "demouser@gmail.com"
}
```

**Response 200**
```json
{
  "success": true,
  "message": "If email exists, OTP reset password has been sent"
}
```

### 7) POST `/api/auth/reset-password`
Reset password menggunakan OTP email.

**Body Request**
```json
{
  "email": "demouser@gmail.com",
  "otp": "123456",
  "newPassword": "NewPassword123!"
}
```

**Response 200**
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

### 8) POST `/api/auth/google/register`
Registrasi menggunakan Google ID token (akun Gmail).

**Body Request**
```json
{
  "idToken": "<GOOGLE_ID_TOKEN>",
  "phone": "081234567890"
}
```

**Response 201**
```json
{
  "success": true,
  "data": {
    "accessToken": "<ACCESS_TOKEN>",
    "refreshToken": "<REFRESH_TOKEN>"
  }
}
```

### 9) POST `/api/auth/google/login`
Login menggunakan Google ID token.

**Body Request**
```json
{
  "idToken": "<GOOGLE_ID_TOKEN>"
}
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "accessToken": "<ACCESS_TOKEN>",
    "refreshToken": "<REFRESH_TOKEN>"
  }
}
```

### 10) GET `/api/auth/policy`
Mengambil kebijakan autentikasi user login saat ini.

Header:
- `Authorization: Bearer <accessToken>`

**Response 200**
```json
{
  "success": true,
  "data": {
    "multilogin": true,
    "mfaEnabled": false
  }
}
```

### 11) PATCH `/api/auth/policy`
Memperbarui kebijakan autentikasi user login saat ini.

Header:
- `Authorization: Bearer <accessToken>`

**Body Request** (minimal satu field wajib diisi)
```json
{
  "multilogin": false,
  "mfaEnabled": true
}
```

Catatan:
- Saat `multilogin` diubah ke `false`, sesi refresh aktif user akan dicabut.
- Saat `mfaEnabled` diubah ke `false`, OTP MFA yang masih aktif akan dibersihkan.

**Response 200**
```json
{
  "success": true,
  "data": {
    "multilogin": false,
    "mfaEnabled": true
  }
}
```

### 12) GET `/api/auth/sessions`
Menampilkan sesi refresh aktif user login saat ini.

Header:
- `Authorization: Bearer <accessToken>`

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "refreshTokenExpired": "2026-03-26T10:00:00.000Z",
      "userAgent": "Mozilla/5.0 ...",
      "ipAddress": "127.0.0.1",
      "createdAt": "2026-03-19T10:00:00.000Z"
    }
  ]
}
```

### 13) DELETE `/api/auth/sessions/:sessionId`
Mencabut satu sesi refresh aktif berdasarkan `sessionId`.

Header:
- `Authorization: Bearer <accessToken>`

**Response 200**
```json
{
  "success": true,
  "message": "Session revoked"
}
```

### 14) GET `/api/auth/security-logs`
Mengambil log keamanan autentikasi milik user login saat ini.

Header:
- `Authorization: Bearer <accessToken>`

Query opsional:
- `limit` (1-100, default 20)

Contoh: `/api/auth/security-logs?limit=10`

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "id": 12,
      "event": "login_failed",
      "ipAddress": null,
      "userAgent": null,
      "metadata": null,
      "createdAt": "2026-03-19T10:02:00.000Z"
    }
  ]
}
```

## Error Umum

**Response 400 - payload tidak valid**
```json
{
  "success": false,
  "message": "Invalid ... payload"
}
```

**Response 401 - kredensial/token tidak valid**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

atau

```json
{
  "success": false,
  "message": "Invalid refresh token"
}
```

**Response 403 - email belum terverifikasi**
```json
{
  "success": false,
  "message": "Email is not verified"
}
```

**Response 429 - akun terkunci sementara**
```json
{
  "success": false,
  "message": "Account locked due to multiple failed attempts"
}
```

**Response 409 - data sudah dipakai**
```json
{
  "success": false,
  "message": "Email already used"
}
```


## Panduan Frontend (refresh token di-hash backend)

Hash refresh token tetap disimpan di backend untuk verifikasi. Untuk integrasi yang direkomendasikan, frontend tidak perlu menyimpan refresh token sendiri karena backend mengirimkannya via HttpOnly cookie.

Alur yang disarankan:
1. Saat login sukses, simpan `accessToken` (memory). Biarkan backend mengelola `refresh_token` di HttpOnly cookie.
2. Simpan `csrf_token` dari cookie non-HttpOnly, kirim nilainya ke header `x-csrf-token` saat memanggil refresh/logout berbasis cookie.
3. Jika request API gagal 401 karena access token expired, panggil `POST /api/auth/refresh-token` tanpa body refresh token (cookie akan ikut otomatis).
4. Jika refresh sukses, update access token dan ulangi request sebelumnya.
4. Jika refresh gagal (401 Invalid refresh token), paksa logout user (hapus token lokal, arahkan ke halaman login).
5. Saat user klik logout, panggil `POST /api/auth/logout` agar sesi refresh di server diinvalidasi.
