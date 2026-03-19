import type { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from './auth.service';

const registerSchema = z.object({
  username: z.string().trim().min(3).max(60),
  email: z
    .string()
    .trim()
    .email()
    .refine((value) => value.toLowerCase().endsWith('@gmail.com')),
  phone: z.string().trim().min(8).max(20),
  password: z.string().min(8).max(120)
});

const loginSchema = z.object({
  identity: z.string().trim().min(3),
  password: z.string().min(8).max(120)
});

const verifyOtpSchema = z.object({
  email: z.string().trim().email(),
  otp: z.string().trim().regex(/^\d{6}$/)
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email()
});

const resetPasswordSchema = z.object({
  email: z.string().trim().email(),
  otp: z.string().trim().regex(/^\d{6}$/),
  newPassword: z.string().min(8).max(120)
});

const refreshSchema = z.object({
  refreshToken: z.string().trim().min(20)
});

const googleSchema = z.object({
  idToken: z.string().trim().min(20),
  phone: z.string().trim().min(8).max(20).optional()
});

const mapAuthError = (error: unknown): { status: number; message: string } => {
  if (!(error instanceof Error)) {
    return { status: 500, message: 'Internal server error' };
  }

  switch (error.message) {
    case 'EMAIL_ALREADY_USED':
      return { status: 409, message: 'Email already used' };
    case 'USERNAME_ALREADY_USED':
      return { status: 409, message: 'Username already used' };
    case 'PHONE_ALREADY_USED':
      return { status: 409, message: 'Phone already used' };
    case 'INVALID_CREDENTIALS':
      return { status: 401, message: 'Invalid credentials' };
    case 'EMAIL_NOT_VERIFIED':
      return { status: 403, message: 'Email is not verified' };
    case 'INVALID_OTP':
      return { status: 400, message: 'Invalid OTP' };
    case 'USER_NOT_FOUND':
      return { status: 404, message: 'User not found' };
    case 'INVALID_REFRESH_TOKEN':
      return { status: 401, message: 'Invalid refresh token' };
    case 'GOOGLE_ACCOUNT_NOT_REGISTERED':
      return { status: 404, message: 'Google account is not registered' };
    case 'GOOGLE_AUTH_NOT_CONFIGURED':
      return { status: 503, message: 'Google auth is not configured' };
    case 'INVALID_GOOGLE_TOKEN':
      return { status: 401, message: 'Invalid Google token' };
    case 'EMAIL_DOMAIN_NOT_ALLOWED':
      return { status: 400, message: 'Only Gmail addresses are allowed' };
    default:
      return { status: 500, message: 'Internal server error' };
  }
};

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  registerManual = async (req: Request, res: Response): Promise<void> => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Invalid register payload' });
      return;
    }

    try {
      const data = await this.authService.registerManual(parsed.data);
      res.status(201).json({
        success: true,
        message: 'Registration successful, OTP sent to email',
        data
      });
    } catch (error) {
      const mapped = mapAuthError(error);
      res.status(mapped.status).json({ success: false, message: mapped.message });
    }
  };

  verifyOtp = async (req: Request, res: Response): Promise<void> => {
    const parsed = verifyOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Invalid verify OTP payload' });
      return;
    }

    try {
      await this.authService.verifyRegisterOtp(parsed.data);
      res.json({ success: true, message: 'Email verified successfully' });
    } catch (error) {
      const mapped = mapAuthError(error);
      res.status(mapped.status).json({ success: false, message: mapped.message });
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Invalid login payload' });
      return;
    }

    try {
      const tokens = await this.authService.login(parsed.data);
      res.json({ success: true, data: tokens });
    } catch (error) {
      const mapped = mapAuthError(error);
      res.status(mapped.status).json({ success: false, message: mapped.message });
    }
  };

  refreshToken = async (req: Request, res: Response): Promise<void> => {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Invalid refresh payload' });
      return;
    }

    try {
      const tokens = await this.authService.refreshToken(parsed.data.refreshToken);
      res.json({ success: true, data: tokens });
    } catch (error) {
      const mapped = mapAuthError(error);
      res.status(mapped.status).json({ success: false, message: mapped.message });
    }
  };

  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Invalid forgot password payload' });
      return;
    }

    await this.authService.forgotPassword(parsed.data);
    res.json({
      success: true,
      message: 'If email exists, OTP reset password has been sent'
    });
  };

  resetPassword = async (req: Request, res: Response): Promise<void> => {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Invalid reset password payload' });
      return;
    }

    try {
      await this.authService.resetPassword(parsed.data);
      res.json({ success: true, message: 'Password reset successful' });
    } catch (error) {
      const mapped = mapAuthError(error);
      res.status(mapped.status).json({ success: false, message: mapped.message });
    }
  };

  registerGoogle = async (req: Request, res: Response): Promise<void> => {
    const parsed = googleSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Invalid Google register payload' });
      return;
    }

    try {
      const tokens = await this.authService.registerWithGoogle(parsed.data);
      res.status(201).json({ success: true, data: tokens });
    } catch (error) {
      const mapped = mapAuthError(error);
      res.status(mapped.status).json({ success: false, message: mapped.message });
    }
  };

  loginGoogle = async (req: Request, res: Response): Promise<void> => {
    const parsed = googleSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Invalid Google login payload' });
      return;
    }

    try {
      const tokens = await this.authService.loginWithGoogle(parsed.data);
      res.json({ success: true, data: tokens });
    } catch (error) {
      const mapped = mapAuthError(error);
      res.status(mapped.status).json({ success: false, message: mapped.message });
    }
  };
}
