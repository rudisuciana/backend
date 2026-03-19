import type { ApiClientType } from '../middlewares/apiKey.middleware';

declare global {
  namespace Express {
    interface Request {
      apiClient?: ApiClientType;
    }
  }
}

export {};
