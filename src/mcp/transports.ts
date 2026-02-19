/**
 * MCP Transport Handlers
 * 
 * Supports STDIO, HTTP, and SSE transports for MCP servers
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { MCPServerConfig } from '../types/mcp.js';
import log from '../services/logger/index.js';

export interface TransportHandler {
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

/**
 * Create STDIO transport for MCP server
 */
export function createStdioTransport(server: McpServer): TransportHandler {
  const transport = new StdioServerTransport({
    command: process.argv[0],
    args: process.argv.slice(1)
  } as any);

  return {
    start: async () => {
      await server.connect(transport);
      log.info('MCP server started with STDIO transport');
    },
    stop: async () => {
      await server.close();
      log.info('MCP server stopped (STDIO transport)');
    }
  };
}

/**
 * Create HTTP transport for MCP server
 * Note: HTTP/SSE transport implementation would go here
 * For now, we'll focus on STDIO as the primary transport
 */
export function createHttpTransport(_server: McpServer, _config: MCPServerConfig): TransportHandler {
  // HTTP transport implementation would be added here
  // This is a placeholder for future HTTP/SSE support
  return {
    start: async () => {
      log.info('HTTP transport not yet implemented');
      throw new Error('HTTP transport not yet implemented');
    },
    stop: async () => {
      log.info('HTTP transport stopped');
    }
  };
}

/**
 * Create SSE transport for MCP server
 */
export function createSSETransport(_server: McpServer, _config: MCPServerConfig): TransportHandler {
  // SSE transport implementation would be added here
  return {
    start: async () => {
      log.info('SSE transport not yet implemented');
      throw new Error('SSE transport not yet implemented');
    },
    stop: async () => {
      log.info('SSE transport stopped');
    }
  };
}

/**
 * Initialize transports based on configuration
 */
export async function initializeTransports(
  server: McpServer,
  config: MCPServerConfig
): Promise<TransportHandler[]> {
  const handlers: TransportHandler[] = [];

  if (config.transports.includes('stdio') && config.stdio?.enabled) {
    handlers.push(createStdioTransport(server));
  }

  if (config.transports.includes('http') && config.http?.enabled) {
    handlers.push(createHttpTransport(server, config));
  }

  if (config.transports.includes('sse') && config.sse?.enabled) {
    handlers.push(createSSETransport(server, config));
  }

  return handlers;
}
