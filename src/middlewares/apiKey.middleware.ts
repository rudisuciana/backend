import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { getMySQLPool } from '../infrastructure/mysql';
import { UserRepository, type UserApiKeyAccess } from '../modules/user/user.repository';

export type ApiClientType = 'user';

const keyByClient: Record<ApiClientType, string> = {
  user: env.userApiKey
};

const defaultUserRepository = new UserRepository(getMySQLPool());

const normalizeIp = (ip: string): string[] => {
  const value = ip.trim();
  if (!value) {
    return [];
  }

  if (value.startsWith('::ffff:')) {
    const mapped = value.slice('::ffff:'.length);
    return [value, mapped];
  }

  return [value];
};

interface RequireApiKeyDeps {
  getApiKeyAccessByApiKey?: (apiKey: string) => Promise<UserApiKeyAccess | null>;
}

export const requireApiKey = (clientType: ApiClientType, deps?: RequireApiKeyDeps) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    const accessGetter =
      deps?.getApiKeyAccessByApiKey ??
      ((value: string) => defaultUserRepository.getApiKeyAccessByApiKey(value));
    const apiAccess = await accessGetter(apiKey);
    const whitelistIp = apiAccess?.whitelistip;
    if (!whitelistIp) {
      res.status(403).json({
        success: false,
        message: 'IP is not allowed'
      });
      return;
    }

    const allowedIps = whitelistIp
      .split(',')
      .flatMap((item) => normalizeIp(item))
      .map((item) => item.trim())
      .filter(Boolean);
    const requestIps = normalizeIp(req.ip ?? '');
    const isAllowed = requestIps.some((ip) => allowedIps.includes(ip));
    if (!isAllowed) {
      res.status(403).json({
        success: false,
        message: 'IP is not allowed'
      });
      return;
    }

    req.apiClient = clientType;
    next();
  };
};
