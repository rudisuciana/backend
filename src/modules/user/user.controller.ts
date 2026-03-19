import type { Request, Response } from 'express';
import { z } from 'zod';
import { UserService } from './user.service';

const userQuerySchema = z.object({
  userId: z.coerce.number().int().positive()
});

export class UserController {
  constructor(private readonly userService: UserService) {}

  ping(_req: Request, res: Response): void {
    res.json({
      success: true,
      message: 'User API reachable'
    });
  }

  getProfile = async (req: Request, res: Response): Promise<void> => {
    const parseResult = userQuerySchema.safeParse(req.query);

    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid query parameter userId'
      });
      return;
    }

    const profile = await this.userService.getProfile(parseResult.data.userId);

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
