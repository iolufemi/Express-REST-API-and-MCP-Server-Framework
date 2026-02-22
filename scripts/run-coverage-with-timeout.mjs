#!/usr/bin/env node
/**
 * Run test:coverage with a hard timeout so the run cannot hang indefinitely.
 * Under c8 the run can hang in the route suite; this script kills the run after
 * COVERAGE_TIMEOUT_MS so you get a clear exit and partial coverage report.
 * Usage: node scripts/run-coverage-with-timeout.mjs
 * Env:   COVERAGE_TIMEOUT_MS (default 120000 = 2 min). Exit code 124 when timeout.
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

const timeoutMs = Number(process.env.COVERAGE_TIMEOUT_MS) || 120000;

const child = spawn(
  'npx',
  [
    'c8',
    '--reporter=text',
    '--reporter=text-summary',
    '--reporter=html',
    '--reporter=lcov',
    'npx',
    'mocha',
    '--exit'
  ],
  { cwd: rootDir, stdio: 'inherit' }
);

let timedOut = false;
const timer = setTimeout(() => {
  timedOut = true;
  console.error('\n[run-coverage-with-timeout] Hard timeout reached (%ds). Killing test run.\n', timeoutMs / 1000);
  child.kill('SIGTERM');
  process.exit(124);
}, timeoutMs);

child.on('exit', (code, signal) => {
  clearTimeout(timer);
  if (!timedOut) {
    process.exit(code != null ? code : (signal ? 1 : 0));
  }
});
