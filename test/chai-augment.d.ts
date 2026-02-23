/// <reference types="chai" />

// Augment Chai for chai-as-promised (.rejected, .fulfilled) and sinon-chai (.been.calledOnce, etc.)
declare namespace Chai {
  interface Assertion {
    rejected: Assertion;
    fulfilled: Assertion;
    been: Assertion;
    calledOnce: void;
    calledWith(...args: unknown[]): void;
  }
}
