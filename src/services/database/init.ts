/**
 * Database Initialization Service
 * 
 * Ensures all database connections are established before the application starts
 */

import log from '../logger/index.js';
import mongo from './mongo.js';
import logMongo from './logMongo.js';
import redis from './redis.js';
import sql from './sql.js';
import config from '../../config/index.js';
import { retryWithBackoff } from './retry.js';

export interface DatabaseConnectionStatus {
  mongo: boolean;
  logMongo: boolean;
  redis: boolean;
  sql: boolean;
}

/**
 * Wait for MongoDB connection to be ready
 */
function waitForMongoConnection(connection: any, name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Timeout waiting for ${name} MongoDB connection`));
    }, 30000); // 30 second timeout

    if (connection.readyState === 1) {
      // Already connected
      clearTimeout(timeout);
      resolve();
      return;
    }

    connection.once('open', () => {
      clearTimeout(timeout);
      log.info(`${name} MongoDB connection established`);
      resolve();
    });

    connection.once('error', (err: Error) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

/**
 * Wait for Redis connection to be ready
 */
async function waitForRedisConnection(): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timeout waiting for Redis connection'));
    }, 30000); // 30 second timeout

    if (redis.isReady) {
      clearTimeout(timeout);
      resolve();
      return;
    }

    redis.once('ready', () => {
      clearTimeout(timeout);
      log.info('Redis connection established');
      resolve();
    });

    redis.once('error', (err: Error) => {
      clearTimeout(timeout);
      reject(err);
    });

    // If not already connecting, start connection
    if (!redis.isOpen && !redis.isReady) {
      redis.connect().catch((err: Error) => {
        clearTimeout(timeout);
        reject(err);
      });
    }
  });
}

/**
 * Wait for SQL connection to be ready
 */
async function waitForSQLConnection(): Promise<void> {
  try {
    await sql.authenticate();
    log.info('SQL database connection established');
  } catch (err: any) {
    // If SQL is not configured, log warning but don't fail
    if (config.SQLDriver && config.SQLHost !== '127.0.0.1') {
      throw err;
    } else {
      log.warn('SQL database not configured, skipping SQL connection');
    }
  }
}

/**
 * Initialize all database connections
 * Returns connection status for each database
 */
export async function initializeDatabases(): Promise<DatabaseConnectionStatus> {
  log.info('Initializing database connections...');
  
  const status: DatabaseConnectionStatus = {
    mongo: false,
    logMongo: false,
    redis: false,
    sql: false
  };

  const connectionPromises: Promise<void>[] = [];

  // Initialize MongoDB connections with retry logic
  try {
    connectionPromises.push(
      retryWithBackoff(
        () => waitForMongoConnection(mongo, 'Main'),
        {
          maxRetries: 5,
          initialDelay: 2000,
          maxDelay: 30000
        }
      ).then(() => {
        status.mongo = true;
      })
    );
  } catch (err: any) {
    log.error('Failed to initialize main MongoDB after retries:', err);
    throw err;
  }

  try {
    connectionPromises.push(
      retryWithBackoff(
        () => waitForMongoConnection(logMongo, 'Log'),
        {
          maxRetries: 5,
          initialDelay: 2000,
          maxDelay: 30000
        }
      ).then(() => {
        status.logMongo = true;
      })
    );
  } catch (err: any) {
    log.error('Failed to initialize log MongoDB after retries:', err);
    throw err;
  }

  // Initialize Redis connection with retry logic
  try {
    connectionPromises.push(
      retryWithBackoff(
        () => waitForRedisConnection(),
        {
          maxRetries: 5,
          initialDelay: 2000,
          maxDelay: 30000
        }
      ).then(() => {
        status.redis = true;
      })
    );
  } catch (err: any) {
    log.error('Failed to initialize Redis after retries:', err);
    // Redis is optional for some operations, but required for queues
    // In production, we should fail if Redis is required
    if (config.env === 'production') {
      throw new Error('Redis connection required in production');
    } else {
      log.warn('Redis connection failed, continuing without Redis (some features may not work)');
    }
  }

  // Initialize SQL connection (optional) with retry logic
  try {
    connectionPromises.push(
      retryWithBackoff(
        () => waitForSQLConnection(),
        {
          maxRetries: 3,
          initialDelay: 2000,
          maxDelay: 30000
        }
      ).then(() => {
        status.sql = true;
      }).catch((err: any) => {
        // SQL is optional, log but don't fail
        log.warn('SQL connection not available after retries:', err.message);
      })
    );
  } catch (err: any) {
    log.warn('SQL connection initialization skipped');
  }

  // Wait for all critical connections (MongoDB)
  await Promise.all([
    connectionPromises[0], // Main MongoDB
    connectionPromises[1]  // Log MongoDB
  ]);

  // Wait for Redis if it's critical
  if (config.env === 'production') {
    await connectionPromises[2]; // Redis
  } else {
    // In development, Redis is optional
    connectionPromises[2]?.catch(() => {
      // Already logged
    });
  }

  log.info('Database initialization complete', status);
  return status;
}

/**
 * Check if all required databases are connected
 */
export function checkDatabaseHealth(): DatabaseConnectionStatus {
  return {
    mongo: mongo.readyState === 1,
    logMongo: logMongo.readyState === 1,
    redis: redis.isReady || false,
    sql: sql.authenticate !== undefined // Basic check
  };
}

export default initializeDatabases;
