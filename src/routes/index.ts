import express, { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import response from '../services/response/index.js';
import encryption from '../services/encryption/index.js';
import log, { errorHandler } from '../services/logger/index.js';
import me from '../../package.json';
import initialize from './initialize.js';
import config from '../config/index.js';
import helmet from 'helmet';
import limiter from 'express-limiter';
import _ from 'lodash';
import bodyParser from 'body-parser';
import cors from 'cors';
import hpp from 'hpp';
import contentLength from 'express-content-length-validator';
import url from 'url';
import fnv from 'fnv-plus';
import Cacheman from 'cacheman';
import EngineRedis from 'cacheman-redis';
import queue from '../services/queue/index.js';
import fs from 'fs';
import shortId from 'shortid';
import nocache from 'nocache';
import { ExpressRequest, ExpressResponse, ExpressNext } from '../types/express.js';
import health from './health.js';
import mcp from './mcp.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAX_CONTENT_LENGTH_ACCEPTED = parseInt(config.maxContentLength || '9999', 10);

/**
 * Create and configure the router. Uses dynamic import() for optional Redis so we stay ESM-only.
 */
async function createRouter(): Promise<Router> {
  const router: Router = express.Router();

  let redisClient: unknown = null;
  try {
    const db = await import('../services/database/index.js');
    redisClient = db.default?.redis ?? null;
  } catch {
    log.warn('Redis client not available, rate limiting may not work');
  }

  const rateLimiter = redisClient ? limiter(router, redisClient as Parameters<typeof limiter>[1]) : null;

  // Load routes. Comes with versioning. unversioned routes should be named like 'user.ts'
  // versioned files or routes should be named as user.v1.ts.
  // The versioned routes will be available at /v1/routename or as the route version reads
  // The latest version will also be loaded on the default route /routename
  interface RouterWithLoadRoutes extends Router {
    _loadRoutes: (routeFiles: string[]) => Promise<Record<string, Router>>;
    _sanitizeRequestUrl: (req: ExpressRequest) => string;
    _allRequestData: (req: ExpressRequest, res: ExpressResponse, next: ExpressNext) => void;
    _APICache: (req: ExpressRequest, res: ExpressResponse, next: ExpressNext) => void;
  }

  (router as RouterWithLoadRoutes)._loadRoutes = async function (routeFiles: string[]): Promise<Record<string, Router>> {
    const versions: Array<Record<string, string>> = [];
    const ourRoutes: Record<string, Router> = {};
  
    // Load routes using ES modules
    const routeLoadPromises: Promise<void>[] = [];
  
    routeFiles.forEach((file) => {
      const splitFileName = file.split('.');
      if (splitFileName[0] !== 'index' && splitFileName[0] !== 'initialize') {
        const routeLoadPromise = (async () => {
          try {
            // Use dynamic import for ES modules
            const routeModule = await import('./' + splitFileName[0] + '.' + splitFileName[1]);
            const routeHandler = routeModule.default as Router;
  
            if (splitFileName.length === 3) {
              // Versioned route (e.g., users.v1.ts)
              const routeKey = splitFileName[0] + '.' + splitFileName[1];
              ourRoutes[routeKey] = routeHandler;
              router.use('/' + splitFileName[1], routeHandler);
              const splitVersion = splitFileName[1].split('v');
              const versionMap: Record<string, string> = {};
              versionMap[splitFileName[0]] = splitVersion[1];
              versions.push(versionMap);
            } else {
              // Unversioned route (e.g., users.ts)
              ourRoutes[splitFileName[0]] = routeHandler;
              router.use('/', routeHandler);
            }
          } catch (err: unknown) {
            log.error(`Failed to load route ${file}:`, err);
            // Continue loading other routes even if one fails
          }
        })();
  
        routeLoadPromises.push(routeLoadPromise);
      }
    });
  
    // Wait for all routes to load
    await Promise.all(routeLoadPromises);
  
    // Process versioning after all routes are loaded
    if (versions.length > 0) {
      const finalVersions: Record<string, string[]> = {};
      _.forEach(versions, (value: Record<string, string>) => {
        _.forOwn(value, (val: string, key: string) => {
          if (_.has(finalVersions, key)) {
            finalVersions[key].push(val);
          } else {
            finalVersions[key] = [];
            finalVersions[key].push(val);
          }
        });
      });
      _.forOwn(finalVersions, (value: string[], key: string) => {
        const sorted = value.sort();
        const sortedlength = sorted.length;
        const latestVersionRoute = ourRoutes[key + '.v' + sortedlength];
        if (latestVersionRoute) {
          router.use('/', latestVersionRoute);
        }
      });
    }
  
    return ourRoutes;
  };
  
  (router as RouterWithLoadRoutes)._sanitizeRequestUrl = function (req: ExpressRequest): string {
    const requestUrl = url.format({
      protocol: req.protocol,
      host: req.hostname,
      pathname: req.originalUrl || req.url,
      query: req.query as Record<string, string>
    });
  
    return requestUrl.replace(/(password=).*?(&|$)/ig, '$1<hidden>$2');
  };
  
  (router as RouterWithLoadRoutes)._allRequestData = function (req: ExpressRequest, _res: ExpressResponse, next: ExpressNext): void {
    const requestData: Record<string, unknown> = {};
    req.param = function (key: string, defaultValue?: unknown): string {
      const newRequestData = _.assignIn(requestData, req.params, req.body, req.query);
      if (newRequestData[key] !== undefined && newRequestData[key] !== null) {
        return String(newRequestData[key]);
      }
      if (defaultValue !== undefined && defaultValue !== null) {
        return String(defaultValue);
      }
      return '';
    };
    next();
  };
  
  (router as RouterWithLoadRoutes)._APICache = function (req: ExpressRequest, res: ExpressResponse, next: ExpressNext): void {
    // Only use Redis cache if available
    if (!redisClient) {
      log.warn('Redis not available, caching disabled');
      next();
      return;
    }
    
    const cache = new EngineRedis(redisClient as ConstructorParameters<typeof EngineRedis>[0]);
    const APICache = new Cacheman(me.name, { engine: cache, ttl: parseInt(config.backendCacheExpiry || '90', 10) });
    req.cache = APICache;
    // Tell Frontend to Cache responses
    res.set({ 'Cache-Control': 'private, max-age=' + config.frontendCacheExpiry + '' });
  
    const key: string[] = [];
    key.push(req.url);
    key.push(req.ip ?? '');
    key.push(String(req.get('user-agent') ?? ''));
    if (req.accountId) {
      key.push(req.accountId);
    }
    req.cacheKey = key;
    // Remember to delete cache when you get a POST call
    // Only cache GET calls
    if (req.method === 'GET') {
      //  if record is not in cache, set cache else get cache
      req.cache.get(req.cacheKey)
        .then((resp: unknown) => {
          if (!resp) {
            // Will be set on successful response
            next();
          } else {
            res.ok?.(resp, true);
          }
        })
        .catch((err: Error) => {
          log.error('Failed to get cached data: ', err);
          // Don't block the call because of this failure.
          next();
        });
    } else {
      if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH' || req.method === 'DELETE') {
        req.cache.del(req.cacheKey)
          .then(() => { })
          .catch((err: Error) => {
            log.error('Failed to delete cached data: ', err);
            // Don't block the call because of this failure.
          }); // No delays
      }
      next();
    }
  };
  
  router.use(helmet());
  router.use(cors());
  router.options('*', cors());
  router.use(bodyParser.urlencoded({ extended: false }));
  router.use(bodyParser.json({ limit: '50mb' }));
  router.use(bodyParser.raw({ limit: '50mb' }));
  router.use(bodyParser.text({ limit: '50mb' }));
  
  // Log requests here
  router.use((req: ExpressRequest, res: ExpressResponse, next: ExpressNext) => {
    const ipAddress = req.ip || '127.0.0.1';
    req.requestId = fnv.hash(shortId.generate() + Math.floor(100000 + Math.random() * 900000) + '' + Date.now() + '' + ipAddress, 128).str();
    res.set('X-Request-Id', req.requestId);
  
    const reqLog = {
      RequestId: req.requestId,
      ipAddress: ipAddress,
      url: (router as RouterWithLoadRoutes)._sanitizeRequestUrl(req),
      method: req.method,
      body: _.omit(req.body, ['password', 'cardno']),
      app: req.appId,
      user: req.accountId,
      device: req.get('user-agent') || '',
      createdAt: new Date()
    };
  
    // Dump it in the queue
    queue.create('logRequest', reqLog)
      .save();
  
    // persist RequestLog entry in the background; continue immediately
    log.info(reqLog);
    next();
  });
  
  // load response handlers
  router.use(response);
  // Watch for encrypted requests
  router.use(encryption.interpreter);
  router.use(hpp());
  router.use(contentLength.validateMax({ max: MAX_CONTENT_LENGTH_ACCEPTED, status: 400, message: 'Stop! Maximum content length exceeded.' })); // max size accepted for the content-length
  // add the param function to request object
  router.use((router as RouterWithLoadRoutes)._allRequestData);
  
  // API Rate limiter (only if Redis is available)
  if (rateLimiter) {
    rateLimiter({
      path: '*',
      method: 'all',
      lookup: ['ip', 'accountId', 'appId', 'developer'],
      total: parseInt(config.rateLimit || '1800', 10),
      expire: parseInt(config.rateLimitExpiry || '3600000', 10),
      onRateLimited: function (_req: ExpressRequest, _res: ExpressResponse, next: ExpressNext) {
        next({ message: 'Rate limit exceeded', statusCode: 429 });
      }
    });
  } else {
    log.warn('Rate limiting disabled - Redis not available');
  }
  
  // no client side caching
  if (config.noFrontendCaching === 'yes') {
    router.use(nocache());
  } else {
    router.use((router as RouterWithLoadRoutes)._APICache);
  }
  
  router.get('/', (_req: ExpressRequest, res: ExpressResponse) => {
    res.ok?.({ name: me.name, version: me.version });
  });
  
  // Let's Encrypt Setup
  router.get(config.letsencryptSSLVerificationURL, (_req: ExpressRequest, res: ExpressResponse) => {
    res.send(config.letsencryptSSLVerificationBody);
  });
  
  // Health check routes (publicly available)
  router.use('/health', health);

  // MCP configuration routes (publicly available)
  router.use('/mcp', mcp);

  // Publicly available routes here, IE. routes that should work with out requiring userid, appid and developer.
  router.use('/', initialize);

  // Should automatically load routes
  // Other routes here
  const normalizedPath = path.join(__dirname, './');
  const routeFiles = fs.readdirSync(normalizedPath).filter((file) => {
    // Only load TypeScript route files
    return file.endsWith('.ts') || file.endsWith('.js');
  });
  
  // Load routes asynchronously
  (router as RouterWithLoadRoutes)._loadRoutes(routeFiles).catch((err: Error) => {
    log.error('Error loading routes:', err);
  });
  
  // Finished loading routes
  
  router.use((_req: ExpressRequest, res: ExpressResponse, _next: ExpressNext) => {
    res.notFound?.();
  });
  
  router.use(errorHandler);

  return router;
}

export default createRouter();
