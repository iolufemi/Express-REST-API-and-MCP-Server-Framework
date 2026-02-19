import cluster from 'cluster';
import config from './config/index.js';
import log from './services/logger/index.js';
import express, { Express } from 'express';
import expressEnforcesSSL from 'express-enforces-ssl';
import os from 'os';
import { createUnifiedMCPServer } from './mcp/servers/unified.js';
import { autoRegisterServices } from './mcp/auto-register.js';
import mcpRegistry from './mcp/registry.js';
import { MCPServerConfig } from './types/mcp.js';
import { initializeDatabases } from './services/database/init.js';
import { setupShutdownHandlers } from './services/shutdown.js';
import { Server } from 'http';

let app: Express;
let server: Server | null = null;

/**
 * Start the application server
 */
async function startServer(): Promise<void> {
  try {
    // Initialize database connections before starting server
    log.info('Initializing database connections...');
    await initializeDatabases();
    log.info('Database connections established');

    app = express();
    
    if (config.trustProxy === 'yes') {
      app.enable('trust proxy');
    }

    if (config.enforceSSL === 'yes') {
      app.use(expressEnforcesSSL() as express.RequestHandler);
    }

    const router = await import('./routes/index.js').then((m) => m.default);
    app.use('/', router);

    if (config.env === 'production' && cluster.worker) {
      log.info('Worker %d running!', cluster.worker.id);
    }

    server = app.listen(config.port, () => {
      const address = server!.address();
      if (address && typeof address !== 'string') {
        const host = address.address;
        const port = address.port;
        log.info('API server listening on host ' + host + ', port ' + port + '!');
      } else {
        log.info('API server listening on port ' + config.port + '!');
      }

      // Setup graceful shutdown handlers after server starts
      setupShutdownHandlers(server!);
    });

    // Initialize MCP servers if enabled (after databases are ready)
    if (process.env.ENABLE_MCP === 'true' || config.env === 'development') {
      initializeMCPServers().catch((err) => {
        log.error('Error initializing MCP servers:', err);
      });
    }
  } catch (error) {
    log.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (cluster.isPrimary && config.env === 'production') {
  // In production, use clustering for better performance
  // Note: Bull queue UI would need to be set up separately (e.g., using Bull Board)
  // For now, we'll skip the queue UI setup as Bull doesn't have a built-in UI like Kue
  
  // Count the machine's CPUs
  const cpuCount = os.cpus().length;

  // Create a worker for each CPU
  for (let i = 0; i < cpuCount; i += 1) {
    cluster.fork();
  }

  // Listen for dying workers
  cluster.on('exit', (worker) => {
    // Replace the dead worker
    log.info('Worker %d died', worker.id);
    cluster.fork();
  });
} else {
  // Start server (will initialize databases first)
  startServer();
}

/**
 * Initialize MCP servers
 */
async function initializeMCPServers(): Promise<void> {
  try {
    log.info('Initializing MCP servers...');

    // Auto-register services from mcp/services directory
    await autoRegisterServices();

    // Create unified MCP server
    const mcpConfig: MCPServerConfig = {
      name: 'express-api-generator-mcp',
      version: '1.0.0',
      transports: ['stdio'],
      stdio: {
        enabled: true
      }
    };

    const mcpServer = await createUnifiedMCPServer(mcpConfig);
    
    // Set the server in the registry
    mcpRegistry.setServer(mcpServer.server);

    // Start MCP server (only in development or when explicitly enabled)
    if (process.env.START_MCP_SERVER === 'true') {
      await mcpServer.start();
      log.info('MCP servers initialized and started');
    } else {
      log.info('MCP servers initialized (not started - set START_MCP_SERVER=true to start)');
    }
  } catch (error) {
    log.error('Failed to initialize MCP servers:', error);
  }
}
