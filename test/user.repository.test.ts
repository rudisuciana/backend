import { describe, expect, it, vi } from 'vitest';
import { UserRepository } from '../src/modules/user/user.repository';

describe('UserRepository', () => {
  it('should map avatar field when user profile is found', async () => {
    const query = vi.fn().mockResolvedValue([
      [
        {
          id: 1,
          name: 'Demo User',
          email: 'demo@example.com',
          balance: '500000.00',
          status: 'active',
          avatar: 'https://example.com/avatars/demo-user.png'
        }
      ]
    ]);

    const repository = new UserRepository({ query } as never);
    const profile = await repository.getProfileById(1);

    expect(query).toHaveBeenCalledOnce();
    expect(profile).toEqual({
      id: 1,
      name: 'Demo User',
      email: 'demo@example.com',
      balance: 500000,
      status: 'active',
      avatar: 'https://example.com/avatars/demo-user.png'
    });
  });

  it('should return null when user profile is not found', async () => {
    const query = vi.fn().mockResolvedValue([[]]);

    const repository = new UserRepository({ query } as never);
    const profile = await repository.getProfileById(999);

    expect(query).toHaveBeenCalledOnce();
    expect(profile).toBeNull();
  });

  it('should map user profile by api key', async () => {
    const query = vi.fn().mockResolvedValue([
      [
        {
          id: 2,
          name: 'Second User',
          email: 'second@example.com',
          balance: '250000.00',
          status: 'active',
          avatar: null
        }
      ]
    ]);

    const repository = new UserRepository({ query } as never);
    const profile = await repository.getProfileByApiKey('second-key');

    expect(query).toHaveBeenCalledOnce();
    expect(profile).toEqual({
      id: 2,
      name: 'Second User',
      email: 'second@example.com',
      balance: 250000,
      status: 'active',
      avatar: null
    });
  });
});
