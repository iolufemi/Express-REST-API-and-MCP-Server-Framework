module.exports = {
  require: ['ts-node/register', 'test/setup.cjs'],
  extension: ['ts'],
  spec: ['test/**/*.test.ts'],
  timeout: 20000,
  recursive: true
};
