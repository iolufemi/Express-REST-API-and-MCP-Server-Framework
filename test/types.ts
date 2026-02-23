/**
 * Type definitions for test utilities
 */

import type { Request, NextFunction } from 'express';

export interface MockRequest extends Partial<Request> {
  body?: any;
  params?: Record<string, string>;
  query?: Record<string, any>;
  headers?: Record<string, string>;
  ip?: string;
  method?: string;
  url?: string;
  originalUrl?: string;
  accountId?: string;
  appId?: string;
  developer?: string;
  requestId?: string;
  cache?: any;
  cacheKey?: any[];
  param?: (key: string, defaultValue?: any) => any;
}

export interface MockResponse {
  statusCode?: number;
  body?: any;
  headers?: Record<string, string>;
  status?: (code: number) => MockResponse;
  json?: (data: any) => MockResponse;
  send?: (data: any) => MockResponse;
  set?: (field: string | object, value?: string) => MockResponse;
  ok?: (data: any, fromCache?: boolean, extraData?: any) => void;
  badRequest?: (error?: any) => void;
  unauthorized?: (error?: any) => void;
  forbidden?: (error?: any) => void;
  notFound?: (error?: any) => void;
  unprocessable?: (error?: any) => void;
  serverError?: (error?: any) => void;
}

export type MockNext = NextFunction;
