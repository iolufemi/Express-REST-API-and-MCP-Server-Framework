/**
 * Controllers MCP Server
 * 
 * MCP server for exposing controller methods as tools with selective exposure
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerControllerTools } from './tools.js';
import { MCPServerConfig } from '../../../types/mcp.js';
import pkg from '../../../../package.json' with { type: 'json' };

/**
 * Create and configure the Controllers MCP server
 */
export function createControllersMCPServer(config: MCPServerConfig): McpServer {
  const mcpServer = new McpServer(
    {
      name: config.name || 'controllers-mcp-server',
      version: config.version || pkg.version
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  // Register controller tools (low-level API uses underlying server)
  registerControllerTools(mcpServer.server).catch((err) => {
    console.error('Error registering controller tools:', err);
  });

  return mcpServer;
}
