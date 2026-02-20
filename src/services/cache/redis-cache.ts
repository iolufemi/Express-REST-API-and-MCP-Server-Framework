/**
 * Redis cache using node-redis v4 (Promise-based).
 * Replaces cacheman + cacheman-redis for compatibility with the current Redis client.
 */

type RedisClient = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { PX?: number }): Promise<unknown>;
  del(key: string): Promise<number>;
};

export interface RedisCacheOptions {
  client: RedisClient;
  prefix: string;
  ttlSeconds: number;
}

function keyFromParts(prefix: string, parts: (string | undefined)[]): string {
  return prefix + ':' + parts.map((p) => String(p ?? '')).join(':');
}

/**
 * Cache interface compatible with req.cache used in routes and response/ok.ts.
 * Key is an array (e.g. [url, ip, user-agent, accountId]).
 */
export class RedisCache {
  private client: RedisClient;
  private prefix: string;
  private ttlMs: number;

  constructor(options: RedisCacheOptions) {
    this.client = options.client;
    this.prefix = options.prefix;
    this.ttlMs = options.ttlSeconds * 1000;
  }

  get(key: (string | undefined)[]): Promise<unknown> {
    const k = keyFromParts(this.prefix, key);
    return this.client.get(k).then((val) => {
      if (val == null) return null;
      try {
        return JSON.parse(val) as unknown;
      } catch {
        return val;
      }
    });
  }

  set(key: (string | undefined)[], value: unknown): Promise<void> {
    const k = keyFromParts(this.prefix, key);
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    return this.client.set(k, serialized, { PX: this.ttlMs }).then(() => undefined);
  }

  del(key: (string | undefined)[]): Promise<void> {
    const k = keyFromParts(this.prefix, key);
    return this.client.del(k).then(() => undefined);
  }
}

export default RedisCache;
