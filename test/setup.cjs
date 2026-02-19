/**
 * Test setup file - runs before all tests
 * Sets up test environment, mocks, and global test utilities
 */

// dotenv is available at runtime, types are included
const dotenv = require('dotenv');

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.SECURE_MODE = 'true';
process.env.NO_CACHE = 'no';

// Global test timeout
process.env.MOCHA_TIMEOUT = '20000';

// Note: Mocha globals (describe, it, before, after, etc.) are available at runtime
// TypeScript doesn't need explicit imports for these
