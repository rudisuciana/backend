import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';

export type ApiClientType = 'user';

const keyByClient: Record<ApiClientType, string> = {
  user: env.userApiKey
};

export const requireApiKey = (clientType: ApiClientType) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const apiKey = req.header('x-api-key');

    if (!apiKey) {
      res.status(401).json({
        success: false,
        message: 'x-api-key header is required'
      });
      return;
    }

    if (apiKey !== keyByClient[clientType]) {
      res.status(403).json({
        success: false,
        message: 'Invalid API key'
      });
      return;
    }

    req.apiClient = clientType;
    next();
  };
};
