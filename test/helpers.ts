/**
 * Test helper utilities
 */

import { expect } from 'chai';
import express from 'express';
import bodyParser from 'body-parser';
import type { Server } from 'http';

/**
 * Create an Express app with the same router as the main app and listen on an ephemeral port.
 * Use this for API-model tests that need to point the model at a real local server (e.g. /products, /orders).
 * Remember to call server.close() in after().
 */
export async function createTestServer(): Promise<{ app: express.Express; server: Server; port: number }> {
  const response = (await import('../src/services/response/index.js')).default;
  const routerPromise = (await import('../src/routes/index.js')).default;
  const router = await (routerPromise as Promise<express.Router>);

  const app = express();
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(response);
  app.use(router);

  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const address = server.address();
      if (address && typeof address !== 'string') {
        resolve({ app, server, port: address.port });
      } else {
        server.close();
        reject(new Error('Could not get server port'));
      }
    });
    server.on('error', reject);
  });
}
import type { NextFunction } from 'express';

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
 * Wait for a Bull queue to finish processing (waiting + active = 0) or timeout.
 * Use in tests that depend on queue jobs (e.g. saveToTrash) before asserting.
 */
export function waitForQueueDrained(
  getQueue: (name: string) => { getJobCounts(): Promise<{ waiting: number; active: number }> },
  queueName: string,
  timeoutMs: number = 10000
): Promise<void> {
  const queue = getQueue(queueName);
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function check() {
      queue.getJobCounts().then((counts) => {
        if (counts.waiting === 0 && counts.active === 0) {
          return resolve();
        }
        if (Date.now() - start >= timeoutMs) {
          return reject(new Error(`Queue ${queueName} did not drain within ${timeoutMs}ms`));
        }
        setTimeout(check, 50);
      }, reject);
    }
    check();
  });
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
