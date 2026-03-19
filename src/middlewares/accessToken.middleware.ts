import type { NextFunction, Request, Response } from 'express';
import type Redis from 'ioredis';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { getRedisClient } from '../infrastructure/redis';

interface AccessTokenPayload extends jwt.JwtPayload {
  sub?: string;
  jti?: string;
}

interface RequireAccessTokenDeps {
  redisClient?: Redis;
}

const accessTokenKey = (userId: string, jti: string): string => `auth:access:${userId}:${jti}`;

export const requireAccessToken = (deps?: RequireAccessTokenDeps) => {
  const redisClient = deps?.redisClient ?? getRedisClient();

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authorization = req.header('authorization');
    if (!authorization) {
      res.status(401).json({ success: false, message: 'Authorization header is required' });
      return;
    }

    const [scheme, token] = authorization.split(' ');
    if (!scheme || !token || scheme.toLowerCase() !== 'bearer') {
      res.status(401).json({ success: false, message: 'Authorization must be Bearer token' });
      return;
    }

    let payload: AccessTokenPayload;
    try {
      payload = jwt.verify(token, env.auth.accessTokenSecret) as AccessTokenPayload;
    } catch {
      res.status(401).json({ success: false, message: 'Invalid access token' });
      return;
    }

    if (!payload.sub || !payload.jti) {
      res.status(401).json({ success: false, message: 'Invalid access token' });
      return;
    }

    const cachedToken = await redisClient.get(accessTokenKey(payload.sub, payload.jti));
    if (!cachedToken || cachedToken !== token) {
      res.status(401).json({ success: false, message: 'Invalid access token' });
      return;
    }

    req.authUserId = Number(payload.sub);
    next();
  };
};

