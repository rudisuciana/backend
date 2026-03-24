import type { NextFunction, Request, Response } from 'express';
import { logger } from '../config/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');

  const statusCode =
    'status' in err && typeof err.status === 'number'
      ? err.status
      : 'statusCode' in err && typeof err.statusCode === 'number'
        ? err.statusCode
        : 500;

  res.status(statusCode).json({
    success: false,
    message: statusCode === 413 ? 'Payload too large' : 'Internal server error'
  });
};
