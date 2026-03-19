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
  status: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
