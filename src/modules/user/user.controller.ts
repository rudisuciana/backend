import type { Request, Response } from 'express';
import { UserService } from './user.service';

export class UserController {
  constructor(private readonly userService: UserService) {}

  ping = (_req: Request, res: Response): void => {
    res.json({
      success: true,
      message: 'User API reachable'
    });
  };

  getProfile = async (req: Request, res: Response): Promise<void> => {
    const apiKey = req.header('x-api-key');
    if (!apiKey) {
      res.status(401).json({
        success: false,
        message: 'x-api-key header is required'
      });
      return;
    }

    const profile = await this.userService.getProfileByApiKey(apiKey);

    if (!profile) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      data: profile
    });
  };
}
