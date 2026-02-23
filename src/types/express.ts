/**
 * Express type extensions
 */

import type { Request, Response, NextFunction } from 'express';

/** Minimal cache interface (Cacheman) for request caching */
export interface RequestCache {
  get(key: string[]): Promise<unknown>;
  set(key: string[], value: unknown): Promise<unknown>;
  del(key: string[]): Promise<unknown>;
}

/* eslint-disable @typescript-eslint/no-namespace -- Express type augmentation requires namespace for declaration merging */
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
/* eslint-enable @typescript-eslint/no-namespace */

export type ExpressRequest = Request;
export type ExpressResponse = Response;
export type ExpressNext = NextFunction;

export interface RouteHandler {
  (req: Request, res: Response, next: NextFunction): void | Promise<void>;
}
