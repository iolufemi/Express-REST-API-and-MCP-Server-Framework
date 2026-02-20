/// <reference types="mocha" />
/// <reference types="node" />
/// <reference path="./chai-augment.d.ts" />

declare global {
  var __filename: string;
  var __dirname: string;
  var describe: Mocha.SuiteFunction;
  var it: Mocha.TestFunction;
  var before: Mocha.HookFunction<Mocha.Hook>;
  var after: Mocha.HookFunction<Mocha.Hook>;
  var beforeEach: Mocha.HookFunction<Mocha.Hook>;
  var afterEach: Mocha.HookFunction<Mocha.Hook>;
}

export {};
