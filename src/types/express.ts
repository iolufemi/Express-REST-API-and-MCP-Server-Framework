/**
 * Express type extensions
 */

import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      accountId?: string;
      appId?: string;
      developer?: string;
      requestId?: string;
      cache?: any;
      cacheKey?: any[];
      param?: (key: string, defaultValue?: any) => any;
      _required?: string[];
    }

    interface Response {
      ok: (data: any, fromCache?: boolean, extraData?: any) => void;
      badRequest: (error?: any) => void;
      unauthorized: (error?: any) => void;
      forbidden: (error?: any) => void;
      notFound: (error?: any) => void;
      unprocessable: (error?: any) => void;
      serverError: (error?: any) => void;
    }
  }
}

export type ExpressRequest = Request;
export type ExpressResponse = Response;
export type ExpressNext = NextFunction;

export interface RouteHandler {
  (req: Request, res: Response, next: NextFunction): void | Promise<void>;
}
