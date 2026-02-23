#!/usr/bin/env node
/**
 * Test runner: runs Mocha with config from .mocharc.json (tsx + setup via node-option).
 * Seeds env from the same .env sources the app config uses (.env then .env.test).
 * Usage: node test/run.mjs [mocha args...]
 * Examples:
 *   node test/run.mjs           # run all tests
 *   node test/run.mjs --watch   # watch mode
 *   node test/run.mjs test/simple.test.ts  # single file
 */

import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

// Seed env from config sources: .env first, then .env.test (test overrides)
dotenv.config({ path: resolve(rootDir, '.env') });
dotenv.config({ path: resolve(rootDir, '.env.test') });

const env = {
  ...process.env,
  NODE_ENV: 'test',
  TSX_SKIP_TYPE_CHECK: 'true'
};

const result = spawnSync('npx', ['mocha', ...process.argv.slice(2)], {
  cwd: rootDir,
  stdio: 'inherit',
  env
});

process.exit(result.status ?? (result.signal ? 1 : 0));
