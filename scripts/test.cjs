#!/usr/bin/env node
// Override type: module for test execution
process.env.NODE_OPTIONS = (process.env.NODE_OPTIONS || '') + ' --input-type=commonjs';
require('child_process').spawn(
  'node',
  [
    '--input-type=commonjs',
    require.resolve('mocha/bin/mocha'),
    '-r', 'ts-node/register',
    '-r', 'test/setup.cjs',
    'test/**/*.test.ts'
  ],
  { stdio: 'inherit', env: { ...process.env, TS_NODE_PROJECT: 'tsconfig.test.json', TS_NODE_ESM: 'false' } }
).on('exit', process.exit);
