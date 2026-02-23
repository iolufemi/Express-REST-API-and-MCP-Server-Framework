/**
 * Models MCP Server
 * 
 * MCP server for exposing model data as resources and tools
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerModelResources } from './resources.js';
import { registerModelTools } from './tools.js';
import { MCPServerConfig } from '../../../types/mcp.js';
import pkg from '../../../../package.json' with { type: 'json' };

/**
 * Create and configure the Models MCP server
 */
export async function createModelsMCPServer(config: MCPServerConfig): Promise<McpServer> {
  const mcpServer = new McpServer(
    {
      name: config.name || 'models-mcp-server',
      version: config.version || pkg.version
    },
    {
      capabilities: {
        resources: {},
        tools: {}
      }
    }
  );

  await registerModelResources(mcpServer);
  await registerModelTools(mcpServer);

  return mcpServer;
}
