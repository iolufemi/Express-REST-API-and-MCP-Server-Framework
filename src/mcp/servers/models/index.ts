/**
 * Models MCP Server
 * 
 * MCP server for exposing model data as resources and tools
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerModelResources } from './resources.js';
import { registerModelTools } from './tools.js';
import { MCPServerConfig } from '../../../types/mcp.js';

/**
 * Create and configure the Models MCP server
 */
export function createModelsMCPServer(config: MCPServerConfig): McpServer {
  const mcpServer = new McpServer(
    {
      name: config.name || 'models-mcp-server',
      version: config.version || '1.0.0'
    },
    {
      capabilities: {
        resources: {},
        tools: {}
      }
    }
  );

  // Register resources and tools (low-level API uses underlying server)
  registerModelResources(mcpServer.server);
  registerModelTools(mcpServer.server);

  return mcpServer;
}
