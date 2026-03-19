# Dokumentasi Auth API

Dokumentasi ini khusus untuk endpoint channel **Auth**.
Channel ini dipakai untuk registrasi, login, verifikasi OTP, refresh token, dan reset password.

## Base URL
- Local: `http://localhost:3000`

## Catatan Autentikasi
- Endpoint di channel auth **tidak memakai** `x-api-key`.
- Hasil login mengembalikan:
  - `accessToken` (JWT, disimpan sementara di Redis sesuai TTL)
  - `refreshToken` (JWT, dipakai untuk minta access token baru)
- Hasil refresh hanya mengembalikan `accessToken` baru (tanpa refresh token baru).
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
Membuat access token baru menggunakan refresh token tanpa menerbitkan refresh token baru. Jika refresh token sudah expired, user harus login ulang.

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
  "data": {
    "accessToken": "<NEW_ACCESS_TOKEN>"
  }
}
```


### 5) POST `/api/auth/logout`
Logout user dengan menghapus sesi refresh token di server (refresh hash + refresh expiry di database akan dikosongkan).

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

**Response 409 - data sudah dipakai**
```json
{
  "success": false,
  "message": "Email already used"
}
```


## Panduan Frontend (refresh token di-hash backend)

Tidak masalah refresh token di-hash di backend, karena frontend **tetap menyimpan token asli** dari response login. Hash hanya disimpan server untuk verifikasi.

Alur yang disarankan:
1. Saat login sukses, simpan `accessToken` (memory) dan `refreshToken` (HttpOnly cookie lebih aman, atau storage sesuai kebijakan aplikasi).
2. Jika request API gagal 401 karena access token expired, panggil `POST /api/auth/refresh-token` dengan refresh token asli.
3. Jika refresh sukses, update access token dan ulangi request sebelumnya.
4. Jika refresh gagal (401 Invalid refresh token), paksa logout user (hapus token lokal, arahkan ke halaman login).
5. Saat user klik logout, panggil `POST /api/auth/logout` agar sesi refresh di server diinvalidasi.

Catatan: Karena endpoint refresh tidak merotasi refresh token, frontend tetap menggunakan refresh token yang sama sampai masa berlakunya habis atau sampai logout.
