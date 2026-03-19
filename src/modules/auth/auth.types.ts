export interface AuthUser {
  id: number;
  username: string;
  name: string;
  email: string;
  phone: string;
  apikey: string;
  passwordHash: string | null;
  googleId: string | null;
  emailVerifiedAt: string | null;
  refreshTokenHash: string | null;
  refreshTokenExpired: string | null;
  multilogin: boolean;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  mfaEnabled: boolean;
  mfaOtpHash: string | null;
  mfaOtpExpired: string | null;
  status: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AccessTokenPayload {
  accessToken: string;
}
