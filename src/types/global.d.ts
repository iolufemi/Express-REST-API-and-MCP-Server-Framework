/**
 * Global type declarations for packages without types
 */

/// <reference types="node" />

declare module 'aes-js' {
  export namespace utils {
    export namespace hex {
      export function fromBytes(bytes: Uint8Array): string;
      export function toBytes(hex: string): Uint8Array;
    }
    export namespace utf8 {
      export function toBytes(text: string): Uint8Array;
      export function fromBytes(bytes: Uint8Array): string;
    }
  }
  export class Counter {
    constructor(value: number);
  }
  export namespace ModeOfOperation {
    export class ctr {
      constructor(key: Uint8Array, counter: Counter);
      encrypt(bytes: Uint8Array): Uint8Array;
      decrypt(bytes: Uint8Array): Uint8Array;
    }
  }
}

declare module 'randomstring' {
  export function generate(length: number): string;
}

declare module 'debug' {
  function debug(namespace: string): (...args: unknown[]) => void;
  export = debug;
}

declare module 'dotenv' {
  export interface DotenvConfigOptions {
    path?: string;
    encoding?: string;
    debug?: boolean;
  }
  export function config(options?: DotenvConfigOptions): { parsed?: Record<string, string>; error?: Error };
  export default config;
}

declare module 'lodash' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- lodash has no @types; broad type needed for usage
  const _: any;
  export = _;
}

declare module 'hpp' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped package
  const hpp: any;
  export default hpp;
}

declare module 'express-content-length-validator' {
  import { RequestHandler } from 'express';
  const contentLength: { validateMax: (options: { max: number; status?: number; message?: string }) => RequestHandler };
  export default contentLength;
}

declare module 'fnv-plus' {
  const fnv: { hash: (input: string | number, bits?: number) => { str: () => string } };
  export default fnv;
}

declare module 'shortid' {
  function generate(): string;
  export = { generate };
}

declare module 'winston-loggly-bulk' {
  import { TransportStream } from 'winston';
  class WinstonLoggly extends TransportStream {
    constructor(options: Record<string, unknown>);
  }
  export = WinstonLoggly;
}

declare module 'express-enforces-ssl' {
  function enforceSSL(): unknown;
  export = enforceSSL;
}

declare module 'cron' {
  export class CronJob {
    constructor(options: {
      cronTime: string;
      onTick: () => void;
      start?: boolean;
      timeZone?: string;
    });
    start(): void;
    stop(): void;
  }
}
