#!/usr/bin/env node
/**
 * Run Mocha and write spec output to test-results.txt so you can see passed/failed tests.
 * Usage: node scripts/run-tests-with-output.mjs
 */
import { spawn } from 'child_process';
import { createWriteStream } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outPath = join(root, 'test-results.txt');

const env = {
  ...process.env,
  TSX_SKIP_TYPE_CHECK: 'true',
  NODE_OPTIONS: '--import tsx',
};

const mocha = spawn(
  join(root, 'node_modules/.bin/mocha'),
  ['--import', 'test/setup.ts', 'test/**/*.test.ts', '--reporter', 'spec'],
  { cwd: root, env, stdio: ['inherit', 'pipe', 'pipe'] }
);

const out = createWriteStream(outPath, { flags: 'w' });

mocha.stdout.pipe(out);
mocha.stderr.pipe(out);
mocha.stdout.pipe(process.stdout);
mocha.stderr.pipe(process.stderr);

mocha.on('close', (code) => {
  out.end();
  console.log('\nResults also written to test-results.txt');
  process.exit(code);
});
