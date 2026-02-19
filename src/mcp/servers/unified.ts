/**
 * Unified MCP Server
 * 
 * Combines all MCP servers (models, controllers, services) into a unified interface
 */

import { createModelsMCPServer } from './models/index.js';
import { createControllersMCPServer } from './controllers/index.js';
import { createServicesMCPServer } from './services/index.js';
import { initializeTransports } from '../transports.js';
import { MCPServerConfig, MCPServerInstance } from '../../types/mcp.js';
import log from '../../services/logger/index.js';

/**
 * Create unified MCP server combining all sub-servers
 */
export async function createUnifiedMCPServer(config: MCPServerConfig): Promise<MCPServerInstance> {
  // Create individual servers
  const modelsServer = await createModelsMCPServer({ ...config, name: 'models-mcp-server' });
  // Note: controllersServer and servicesServer are created but not yet merged into unified server
  // This is a placeholder for future full implementation
  void createControllersMCPServer({ ...config, name: 'controllers-mcp-server' });
  void createServicesMCPServer({ ...config, name: 'services-mcp-server' });

  // For now, we'll use the models server as the primary server
  // In a full implementation, we'd merge capabilities from all servers
  const unifiedServer = modelsServer;

  let transportHandlers: any[] = [];

  return {
    server: unifiedServer,
    config,
    start: async () => {
      log.info('Starting unified MCP server...');
      transportHandlers = await initializeTransports(unifiedServer, config);
      await Promise.all(transportHandlers.map(h => h.start()));
      log.info('Unified MCP server started');
    },
    stop: async () => {
      log.info('Stopping unified MCP server...');
      await Promise.all(transportHandlers.map(h => h.stop()));
      log.info('Unified MCP server stopped');
    }
  };
}

export default createUnifiedMCPServer;
