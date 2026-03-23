import { describe, expect, it, vi } from 'vitest';
import { AuthRepository } from '../src/modules/auth/auth.repository';

describe('AuthRepository missing table tolerance', () => {
  it('should not throw when user_sessions table is missing on createSession', async () => {
    const pool = {
      execute: vi.fn().mockRejectedValue({ code: 'ER_NO_SUCH_TABLE' })
    };
    const repository = new AuthRepository(pool as never);

    await expect(repository.createSession(1, 'hash', new Date().toISOString())).resolves.toBeUndefined();
  });

  it('should not throw when auth_security_logs table is missing on createSecurityLog', async () => {
    const pool = {
      execute: vi.fn().mockRejectedValue({ code: 'ER_NO_SUCH_TABLE' })
    };
    const repository = new AuthRepository(pool as never);

    await expect(repository.createSecurityLog(1, 'login_failed')).resolves.toBeUndefined();
  });

  it('should rethrow non-missing-table database errors', async () => {
    const error = { code: 'ER_ACCESS_DENIED_ERROR' };
    const pool = {
      execute: vi.fn().mockRejectedValue(error)
    };
    const repository = new AuthRepository(pool as never);

    await expect(repository.createSecurityLog(1, 'login_failed')).rejects.toBe(error);
  });
});
