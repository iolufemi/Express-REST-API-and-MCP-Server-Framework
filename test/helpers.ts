/**
 * Test helper utilities
 */

import { expect } from 'chai';
import type { Request, Response, NextFunction } from 'express';
import type { MockResponse } from './types';

/**
 * Create a mock Express request object
 */
export function createMockRequest(overrides: any = {}): any {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    ip: '127.0.0.1',
    method: 'GET',
    url: '/',
    originalUrl: '/',
    ...overrides
  };
}

/**
 * Create a mock Express response object
 */
export function createMockResponse(): any {
  const res: any = {
    status: (code: number) => {
      res.statusCode = code;
      return res;
    },
    json: (data: any) => {
      res.body = data;
      return res;
    },
    send: (data: any) => {
      res.body = data;
      return res;
    },
    set: (field: string | object, value?: string) => {
      if (!res.headers) {
        res.headers = {};
      }
      if (typeof field === 'string') {
        res.headers[field] = value || '';
      } else {
        Object.assign(res.headers, field);
      }
      return res;
    },
    statusCode: 200,
    body: null,
    headers: {}
  };
  return res;
}

/**
 * Create a mock Express next function
 */
export function createMockNext(): NextFunction {
  return (err?: any) => {
    if (err) {
      throw err;
    }
  };
}

/**
 * Wait for a specified number of milliseconds
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Assert that a promise rejects with a specific error
 */
export async function expectRejection(
  promise: Promise<any>,
  expectedError?: string | RegExp | Error
): Promise<void> {
  try {
    await promise;
    expect.fail('Expected promise to reject');
  } catch (error) {
    if (expectedError) {
      if (typeof expectedError === 'string') {
        expect(error.message).to.include(expectedError);
      } else if (expectedError instanceof RegExp) {
        expect(error.message).to.match(expectedError);
      } else {
        expect(error).to.be.instanceOf(Error);
      }
    }
  }
}
