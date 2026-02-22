/**
 * Configuration type definitions
 */

export interface Config {
  env: string;
  port: number;
  trustProxy: string;
  bugsnagKey: string | false;
  secureMode: string | boolean;
  secret: string;
  mongoURL: string;
  logMongoURL: string;
  noFrontendCaching: string;
  frontendCacheExpiry: string;
  backendCacheExpiry: string;
  rateLimit: string;
  rateLimitExpiry: string;
  redisURL: string;
  /** Redis URL for Bull queue (default DB 2). Separate from cache to avoid blocking. */
  redisQueueURL: string;
  letsencryptSSLVerificationURL: string;
  letsencryptSSLVerificationBody: string;
  maxContentLength: string;
  enforceSSL: string;
  gitOAuthToken: string;
  queueUIUsername: string;
  queueUIPassword: string;
  queueUIPort: number;
  enforceUserIdAppIdDeveloperId: string;
  apiDBKey: string;
  SQLUsername: string;
  SQLPassword: string | null;
  SQLDatabase: string;
  SQLHost: string;
  SQLPort: number;
  SQLDriver: 'mysql' | 'sqlite' | 'postgres' | 'mssql';
  SQLTimezone: string;
  clockTimezone: string;
  workerConcurrency: string;
  logglyToken: string | false;
  logglySubdomain: string | false;
  logglyTag: string | false;
  cleanUpFailedJobs: string;
}

export type Environment = 'development' | 'production' | 'test';
