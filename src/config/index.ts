import { Config } from '../types/config.js';
import { env } from './env.js';

const isProduction = env.NODE_ENV === 'production';

const config: Config = {
  env: env.NODE_ENV,
  port: env.PORT,
  trustProxy: env.TRUST_PROXY,
  bugsnagKey: env.BUGSNAG_KEY,
  secureMode: env.SECURE_MODE,
  secret: env.SECRET,
  mongoURL: env.MONGOLAB_URL,
  logMongoURL: env.LOG_MONGOLAB_URL,
  noFrontendCaching: env.NO_CACHE,
  frontendCacheExpiry: env.FRONTEND_CACHE_EXPIRY,
  backendCacheExpiry: env.BACKEND_CACHE_EXPIRY,
  rateLimit: env.RATE_LIMIT,
  rateLimitExpiry: env.RATE_LIMIT_EXPIRY,
  redisURL: env.REDIS_URL,
  redisQueueURL: env.REDIS_QUEUE_URL,
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
    : (env.SQL_PASSWORD),
  SQLDatabase: env.SQL_DATABASE,
  SQLHost: env.SQL_HOST,
  SQLPort: env.SQL_PORT,
  SQLDriver: env.SQL_DRIVER,
  SQLTimezone: env.SQL_TIMEZONE,
  clockTimezone: env.CLOCK_TIMEZONE,
  workerConcurrency: env.WORKER_CONCURRENCY,
  logglyToken: env.LOGGLY_TOKEN,
  logglySubdomain: env.LOGGLY_SUBDOMAIN,
  logglyTag: env.LOGGLY_TAG,
  cleanUpFailedJobs: env.CLEANUP_FAILED_JOBS,
  enableMcp: env.ENABLE_MCP === true || env.NODE_ENV === 'development',
  mcpServerName: env.MCP_SERVER_NAME
};

export default config;
