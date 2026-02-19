/**
 * Environment configuration validated with Zod.
 * Loads .env on first import; all keys have defaults for backward compatibility.
 */

import 'dotenv/config';
import { z } from 'zod';

const stringOrFalse = z.preprocess(
  (val) => (val === undefined || val === '' ? false : val),
  z.union([z.string(), z.literal(false)])
);

export const EnvSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(8080),
  TRUST_PROXY: z.string().default('no'),
  BUGSNAG_KEY: stringOrFalse,
  SECURE_MODE: z.preprocess(
    (val) => (val === undefined || val === '' ? false : val === 'true' || val === 'yes'),
    z.union([z.boolean(), z.string()])
  ).default(false),
  SECRET: z.string().default('lakikihdgdfdjjjdgd67264664vdjhjdyncmxuei8336%%^#%gdvdhj????jjhdghduue'),
  MONGOLAB_URL: z.string().default('mongodb://127.0.0.1/snipe'),
  LOG_MONGOLAB_URL: z.string().default('mongodb://127.0.0.1/snipelogs'),
  NO_CACHE: z.string().default('yes'),
  FRONTEND_CACHE_EXPIRY: z.string().default('90'),
  BACKEND_CACHE_EXPIRY: z.string().default('90'),
  RATE_LIMIT: z.string().default('1800'),
  RATE_LIMIT_EXPIRY: z.string().default('3600000'),
  REDIS_URL: z.string().default('redis://127.0.0.1:6379/1'),
  LETSENCRYPT_VERIFICATION_URL: z.string().default('/.well-known/acme-challenge/xvArhQBSilF4V30dGUagNAZ96ASipB0b0ex0kXn0za8'),
  LETSENCRYPT_VERIFICATION_BODY: z.string().default('xvArhQBSilF4V30dGUagNAZ96ASipB0b0ex0kXn0za8._v6aFbaRYWeOmSebtlD-X4Ixf5tPsyULMsXM8HjsK-Q'),
  MAX_CONTENT_LENGTH: z.string().default('9999'),
  ENFORCE_SSL: z.string().default('no'),
  GIT_OAUTH_TOKEN: z.string().default('86d6eb7abe03e8ae6a970cb67622e667c9c0f86a'),
  QUEUE_UI_USERNAME: z.string().default('admin'),
  QUEUE_UI_PASSWORD: z.string().default('password123/'),
  QUEUE_UI_PORT: z.coerce.number().default(3000),
  ENFORCE_USER_ID_APP_ID_DEVELOPER_ID: z.string().default('no'),
  API_DB_Key: z.string().default('MDg4NWM1NTA0ZTZlNTQ5MjAzNzA1ODBlOWVkNzI3MzdlNmYxZTcyMjVkOTA3N2JjYTBhZjA0YmM0N2U4NDZkNi8vLy8vLzQ1MDY='),
  SQL_USERNAME: z.string().default('root'),
  SQL_PASSWORD: z.preprocess(
    (v) => (v === undefined || v === '' ? null : v),
    z.union([z.string(), z.null()]).default('command')
  ),
  SQL_DATABASE: z.string().default('snipe'),
  SQL_HOST: z.string().default('127.0.0.1'),
  SQL_PORT: z.coerce.number().default(3306),
  SQL_DRIVER: z.enum(['mysql', 'sqlite', 'postgres', 'mssql']).default('mysql'),
  SQL_TIMEZONE: z.string().default('+01:00'),
  CLOCK_TIMEZONE: z.string().default('Africa/Lagos'),
  WORKER_CONCURRENCY: z.string().default('1'),
  LOGGLY_TOKEN: stringOrFalse,
  LOGGLY_SUBDOMAIN: stringOrFalse,
  LOGGLY_TAG: stringOrFalse,
  CLEANUP_FAILED_JOBS: z.string().default('yes')
});

export type Env = z.infer<typeof EnvSchema>;

/**
 * Parsed env. Used by config/index to build Config with NODE_ENV-specific overrides.
 */
export const env: Env = EnvSchema.parse(process.env);
