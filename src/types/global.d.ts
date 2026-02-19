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
  function debug(namespace: string): (...args: any[]) => void;
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
  const _: any;
  export = _;
}

declare module 'express-limiter' {
  const limiter: any;
  export default limiter;
}

declare module 'hpp' {
  const hpp: any;
  export default hpp;
}

declare module 'express-content-length-validator' {
  const contentLength: any;
  export default contentLength;
}

declare module 'fnv-plus' {
  const fnv: any;
  export default fnv;
}

declare module 'cacheman' {
  class Cacheman {
    constructor(name: string, options?: any);
    get(key: string | string[]): Promise<any>;
    set(key: string | string[], value: any, ttl?: number): Promise<any>;
    del(key: string | string[]): Promise<any>;
    clear(): Promise<any>;
  }
  export = Cacheman;
}

declare module 'cacheman-redis' {
  class EngineRedis {
    constructor(options?: any);
  }
  export = EngineRedis;
}

declare module 'shortid' {
  function generate(): string;
  export = { generate };
}

declare module 'winston-loggly-bulk' {
  import { TransportStream } from 'winston';
  class WinstonLoggly extends TransportStream {
    constructor(options: any);
  }
  export = WinstonLoggly;
}

declare module 'express-enforces-ssl' {
  function enforceSSL(): any;
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
