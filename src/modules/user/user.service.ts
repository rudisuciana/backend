import { UserRepository, type UserProfile } from './user.repository';

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getProfile(userId: number): Promise<UserProfile | null> {
    return this.userRepository.getProfileById(userId);
  }
}
