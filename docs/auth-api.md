# Dokumentasi Auth API

Dokumentasi ini khusus untuk endpoint channel **Auth**.
Channel ini dipakai untuk registrasi, login, verifikasi OTP, refresh token, dan reset password.

## Base URL
- Local: `http://localhost:3000`

## Catatan Autentikasi
- Endpoint di channel auth **tidak memakai** `x-api-key`.
- Hasil login/refresh mengembalikan:
  - `accessToken` (JWT, disimpan sementara di Redis sesuai TTL)
  - `refreshToken` (JWT, dipakai untuk minta access token baru)
- Untuk akses endpoint produk website gunakan:
  - `Authorization: Bearer <accessToken>`

## Endpoint

### 1) POST `/api/v1/auth/register`
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

### 2) POST `/api/v1/auth/verify-otp`
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

### 3) POST `/api/v1/auth/login`
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

### 4) POST `/api/v1/auth/refresh-token`
Membuat access token baru menggunakan refresh token.

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
    "accessToken": "<NEW_ACCESS_TOKEN>",
    "refreshToken": "<NEW_REFRESH_TOKEN>"
  }
}
```

### 5) POST `/api/v1/auth/forgot-password`
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

### 6) POST `/api/v1/auth/reset-password`
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

### 7) POST `/api/v1/auth/google/register`
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

### 8) POST `/api/v1/auth/google/login`
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
