export interface AuthUser {
  id: number;
  username: string;
  name: string;
  email: string;
  phone: string;
  apikey: string;
  avatar: string | null;
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

export interface AuthPolicy {
  multilogin: boolean;
  mfaEnabled: boolean;
}

export interface AuthMe {
  id: number;
  username: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  avatar: string | null;
  emailVerifiedAt: string | null;
  mfaEnabled: boolean;
  multilogin: boolean;
}

export interface AuthSession {
  id: number;
  refreshTokenExpired: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface AuthSecurityLog {
  id: number;
  event: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: string | null;
  createdAt: string;
}

export interface AccessTokenPayload {
  accessToken: string;
}
