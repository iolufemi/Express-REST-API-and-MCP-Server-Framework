/**
 * Test setup file - runs before all tests
 * Sets up test environment, mocks, and global test utilities
 */

import { config as dotenvConfig } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// ES module equivalent of __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Make __filename and __dirname available globally for tests
(global as any).__filename = __filename;
(global as any).__dirname = __dirname;

// Load test environment variables (.env first, then .env.test overrides)
const rootDir = dirname(__dirname);
dotenvConfig({ path: resolve(rootDir, '.env') });
dotenvConfig({ path: resolve(rootDir, '.env.test') });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.SECURE_MODE = 'true';
process.env.NO_CACHE = 'no';

// Global test timeout
process.env.MOCHA_TIMEOUT = '20000';
