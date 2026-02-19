import { Config } from '../types/config.js';
import { env } from './env.js';

const isProduction = env.NODE_ENV === 'production';

const config: Config = {
  env: env.NODE_ENV,
  port: isProduction ? 80 : env.PORT,
  trustProxy: isProduction ? 'yes' : env.TRUST_PROXY,
  bugsnagKey: env.BUGSNAG_KEY as string | false,
  secureMode: isProduction ? true : (env.SECURE_MODE as string | boolean),
  secret: env.SECRET,
  mongoURL: isProduction ? 'mongodb://192.168.99.100/snipe' : env.MONGOLAB_URL,
  logMongoURL: isProduction ? 'mongodb://192.168.99.100/snipelogs' : env.LOG_MONGOLAB_URL,
  noFrontendCaching: isProduction ? 'no' : env.NO_CACHE,
  frontendCacheExpiry: env.FRONTEND_CACHE_EXPIRY,
  backendCacheExpiry: env.BACKEND_CACHE_EXPIRY,
  rateLimit: env.RATE_LIMIT,
  rateLimitExpiry: env.RATE_LIMIT_EXPIRY,
  redisURL: isProduction ? 'redis://192.168.99.100:6379/1' : env.REDIS_URL,
  letsencryptSSLVerificationURL: env.LETSENCRYPT_VERIFICATION_URL,
  letsencryptSSLVerificationBody: env.LETSENCRYPT_VERIFICATION_BODY,
  maxContentLength: env.MAX_CONTENT_LENGTH,
  enforceSSL: env.ENFORCE_SSL,
  gitOAuthToken: env.GIT_OAUTH_TOKEN,
  queueUIUsername: env.QUEUE_UI_USERNAME,
  queueUIPassword: env.QUEUE_UI_PASSWORD,
  queueUIPort: env.QUEUE_UI_PORT,
  enforceUserIdAppIdDeveloperId: env.ENFORCE_USER_ID_APP_ID_DEVELOPER_ID,
  apiDBKey: env.API_DB_Key,
  SQLUsername: env.SQL_USERNAME,
  SQLPassword: isProduction && (process.env.SQL_PASSWORD === undefined || process.env.SQL_PASSWORD === '')
    ? null
    : (env.SQL_PASSWORD as string | null),
  SQLDatabase: env.SQL_DATABASE,
  SQLHost: isProduction ? '192.168.99.100' : env.SQL_HOST,
  SQLPort: env.SQL_PORT,
  SQLDriver: env.SQL_DRIVER,
  SQLTimezone: env.SQL_TIMEZONE,
  clockTimezone: env.CLOCK_TIMEZONE,
  workerConcurrency: env.WORKER_CONCURRENCY,
  logglyToken: env.LOGGLY_TOKEN as string | false,
  logglySubdomain: env.LOGGLY_SUBDOMAIN as string | false,
  logglyTag: env.LOGGLY_TAG as string | false,
  cleanUpFailedJobs: env.CLEANUP_FAILED_JOBS
};

export default config;
