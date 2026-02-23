/**
 * Express type extensions (declaration merge with Express types).
 * Keep in sync with express.ts so global augmentation types match.
 */

import type { Request, Response, NextFunction } from 'express';
import type { RequestCache } from './express.js';

declare global {
  namespace Express {
    interface Request {
      accountId?: string;
      appId?: string;
      developer?: string;
      requestId?: string;
      cache?: RequestCache;
      cacheKey?: string[];
      param?: (key: string, defaultValue?: unknown) => string;
      _required?: string[];
    }

    interface Response {
      ok: (data: unknown, fromCache?: boolean, extraData?: unknown) => void;
      badRequest: (error?: unknown, message?: string) => void;
      unauthorized: (error?: unknown) => void;
      forbidden: (error?: unknown) => void;
      notFound: (error?: unknown) => void;
      unprocessable: (error?: unknown) => void;
      serverError: (error?: unknown) => void;
    }
  }
}

export type ExpressRequest = Request;
export type ExpressResponse = Response;
export type ExpressNext = NextFunction;

export interface RouteHandler {
  (req: Request, res: Response, next: NextFunction): void | Promise<void>;
}
