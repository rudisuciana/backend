import { UserRepository, type UserApiKeyAccess, type UserProfile } from './user.repository';

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getApiKeyAccessByApiKey(apiKey: string): Promise<UserApiKeyAccess | null> {
    return this.userRepository.getApiKeyAccessByApiKey(apiKey);
  }

  async getProfileByApiKey(apiKey: string): Promise<UserProfile | null> {
    return this.userRepository.getProfileByApiKey(apiKey);
  }

  async getProfile(userId: number): Promise<UserProfile | null> {
    return this.userRepository.getProfileById(userId);
  }
}
