/**
 * Health Check Route
 * 
 * Provides health status of the application including database connections
 */

import express, { Router } from 'express';
import { checkDatabaseHealth } from '../services/database/init.js';
import { getQueue } from '../services/queue/bull.js';
import { ExpressRequest, ExpressResponse } from '../types/express.js';
import log from '../services/logger/index.js';

const router: Router = express.Router();

/**
 * Health check endpoint
 * GET /health
 * 
 * Returns:
 * - status: 'healthy' | 'degraded' | 'unhealthy'
 * - databases: Connection status for each database
 * - queues: Queue status
 * - timestamp: Current server time
 */
router.get('/', async (_req: ExpressRequest, res: ExpressResponse) => {
  try {
    const dbHealth = checkDatabaseHealth();
    const queueHealth: Record<string, boolean> = {};
    
    // Check queue health
    const queueNames = ['searchIndex', 'logRequest', 'logResponse', 'saveToTrash', 'sendWebhook', 'sendHTTPRequest'];
    for (const queueName of queueNames) {
      try {
        // Check if queue is accessible (Bull queues are always "connected" once created)
        getQueue(queueName);
        queueHealth[queueName] = true;
      } catch {
        queueHealth[queueName] = false;
      }
    }

    // Determine overall health status
    const criticalDbs = [dbHealth.mongo, dbHealth.logMongo];
    const allCriticalHealthy = criticalDbs.every(status => status === true);
    const someDbsHealthy = criticalDbs.some(status => status === true);

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (allCriticalHealthy) {
      status = 'healthy';
    } else if (someDbsHealthy) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    const healthResponse = {
      status,
      databases: {
        mongo: {
          connected: dbHealth.mongo,
          name: 'Main MongoDB'
        },
        logMongo: {
          connected: dbHealth.logMongo,
          name: 'Log MongoDB'
        },
        redis: {
          connected: dbHealth.redis,
          name: 'Redis'
        },
        sql: {
          connected: dbHealth.sql,
          name: 'SQL Database'
        }
      },
      queues: queueHealth,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };

    // Return appropriate HTTP status code
    const httpStatus = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;
    res.status(httpStatus).json(healthResponse);
  } catch (err: unknown) {
    log.error('Health check error:', err);
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Readiness probe endpoint
 * GET /health/ready
 * 
 * Returns 200 if the application is ready to accept traffic
 * Returns 503 if the application is not ready
 */
router.get('/ready', async (_req: ExpressRequest, res: ExpressResponse) => {
  try {
    const dbHealth = checkDatabaseHealth();
    
    // Application is ready if critical databases are connected
    const isReady = dbHealth.mongo && dbHealth.logMongo;
    
    if (isReady) {
      res.status(200).json({
        ready: true,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        ready: false,
        reason: 'Critical databases not connected',
        databases: {
          mongo: dbHealth.mongo,
          logMongo: dbHealth.logMongo
        },
        timestamp: new Date().toISOString()
      });
    }
  } catch (err: unknown) {
    log.error('Readiness check error:', err);
    res.status(503).json({
      ready: false,
      error: 'Readiness check failed',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Liveness probe endpoint
 * GET /health/live
 * 
 * Returns 200 if the application is alive
 * This is a simple check that the process is running
 */
router.get('/live', (_req: ExpressRequest, res: ExpressResponse) => {
  res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router;
