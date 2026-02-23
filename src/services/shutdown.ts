/**
 * Graceful Shutdown Service
 * 
 * Handles graceful shutdown of the application, closing all connections properly
 */

import log from './logger/index.js';
import mongo from './database/mongo.js';
import logMongo from './database/logMongo.js';
import redis from './database/redis.js';
import sql from './database/sql.js';
import { getQueue } from './queue/bull.js';
import { Server } from 'http';

let server: Server | null = null;
let shutdownInProgress = false;

/**
 * Set the HTTP server instance for graceful shutdown
 */
export function setServer(httpServer: Server): void {
  server = httpServer;
}

/**
 * Close all database connections
 */
async function closeDatabaseConnections(): Promise<void> {
  log.info('Closing database connections...');
  
  const closePromises: Promise<void>[] = [];

  // Close MongoDB connections
  try {
    if (mongo.readyState === 1) {
      closePromises.push(
        mongo.close().then(() => {
          log.info('Main MongoDB connection closed');
        }).catch((err: Error) => {
          log.error('Error closing main MongoDB:', err);
        })
      );
    }
  } catch (err: unknown) {
    log.error('Error closing main MongoDB:', err);
  }

  try {
    if (logMongo.readyState === 1) {
      closePromises.push(
        logMongo.close().then(() => {
          log.info('Log MongoDB connection closed');
        }).catch((err: Error) => {
          log.error('Error closing log MongoDB:', err);
        })
      );
    }
  } catch (err: unknown) {
    log.error('Error closing log MongoDB:', err);
  }

  // Close Redis connection
  try {
    if (redis.isOpen || redis.isReady) {
      closePromises.push(
        redis.quit().then(() => {
          log.info('Redis connection closed');
        }).catch((err: unknown) => {
          log.error('Error closing Redis:', err);
        })
      );
    }
  } catch (err: unknown) {
    log.error('Error closing Redis:', err);
  }

  // Close SQL connection
  try {
    closePromises.push(
      sql.close().then(() => {
        log.info('SQL connection closed');
      }).catch((err: unknown) => {
        log.error('Error closing SQL:', err);
      })
    );
  } catch (err: unknown) {
    log.warn('Error closing SQL (may not be connected):', err);
  }

  // Wait for all connections to close (with timeout)
  await Promise.race([
    Promise.all(closePromises),
    new Promise<void>((resolve) => {
      setTimeout(() => {
        log.warn('Database close timeout, forcing shutdown');
        resolve();
      }, 10000); // 10 second timeout
    })
  ]);
}

/**
 * Close all queue connections
 */
async function closeQueueConnections(): Promise<void> {
  log.info('Closing queue connections...');
  
  const queueNames = ['searchIndex', 'logRequest', 'logResponse', 'saveToTrash', 'sendWebhook', 'sendHTTPRequest'];
  const closePromises: Promise<void>[] = [];

  for (const queueName of queueNames) {
    try {
      const queue = getQueue(queueName);
      closePromises.push(queue.close());
    } catch (err: unknown) {
      log.error(`Error closing queue ${queueName}:`, err);
    }
  }

  // Wait for all queues to close (with timeout)
  await Promise.race([
    Promise.all(closePromises),
    new Promise<void>((resolve) => {
      setTimeout(() => {
        log.warn('Queue close timeout, forcing shutdown');
        resolve();
      }, 10000); // 10 second timeout
    })
  ]);

  log.info('All queue connections closed');
}

/**
 * Graceful shutdown handler
 */
export async function gracefulShutdown(signal: string): Promise<void> {
  if (shutdownInProgress) {
    log.warn('Shutdown already in progress, ignoring signal:', signal);
    return;
  }

  shutdownInProgress = true;
  log.info(`Received ${signal}, starting graceful shutdown...`);

  try {
    // Stop accepting new connections
    if (server) {
      log.info('Closing HTTP server...');
      await new Promise<void>((resolve) => {
        server!.close(() => {
          log.info('HTTP server closed');
          resolve();
        });
      });
    }

    // Close queue connections
    await closeQueueConnections();

    // Close database connections
    await closeDatabaseConnections();

    log.info('Graceful shutdown complete');
    process.exit(0);
  } catch (err: unknown) {
    log.error('Error during graceful shutdown:', err);
    process.exit(1);
  }
}

/**
 * Setup shutdown handlers
 */
export function setupShutdownHandlers(httpServer?: Server): void {
  if (httpServer) {
    setServer(httpServer);
  }

  // Handle SIGTERM (used by process managers like PM2, Docker, Kubernetes)
  process.once('SIGTERM', () => {
    gracefulShutdown('SIGTERM').catch((err) => {
      log.error('Error in SIGTERM handler:', err);
      process.exit(1);
    });
  });

  // Handle SIGINT (Ctrl+C)
  process.once('SIGINT', () => {
    gracefulShutdown('SIGINT').catch((err) => {
      log.error('Error in SIGINT handler:', err);
      process.exit(1);
    });
  });

  // Handle uncaught exceptions
  process.once('uncaughtException', (err: Error) => {
    log.error('Uncaught exception:', err);
    gracefulShutdown('uncaughtException').catch(() => {
      process.exit(1);
    });
  });

  // Handle unhandled promise rejections
  process.once('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
    log.error('Unhandled rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection').catch(() => {
      process.exit(1);
    });
  });

  log.info('Shutdown handlers registered');
}

export default gracefulShutdown;
