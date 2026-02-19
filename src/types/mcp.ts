/**
 * MCP (Model Context Protocol) type definitions
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Tool, Resource, Prompt } from '@modelcontextprotocol/sdk/types.js';

/**
 * MCP tool definition
 */
export interface MCPToolDefinition extends Omit<Tool, 'handler' | 'inputSchema'> {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties?: Record<string, any>;
    required?: string[];
    [key: string]: any;
  };
  handler: (args: any) => Promise<any>;
}

/**
 * MCP resource definition
 */
export interface MCPResourceDefinition extends Omit<Resource, 'contents'> {
  uri: string;
  name: string;
  description: string;
  mimeType?: string;
}

/**
 * MCP prompt definition
 */
export interface MCPPromptDefinition extends Prompt {
  name: string;
  description: string;
  arguments?: Array<{
    name: string;
    description: string;
    required?: boolean;
  }>;
}

/**
 * MCP exposure annotation
 */
export interface MCPExposureAnnotation {
  expose: boolean;
  toolName?: string;
  description?: string;
  resourceURI?: string;
}

/**
 * Controller method metadata for MCP
 */
export interface ControllerMethodMetadata {
  name: string;
  methodName: string;
  description?: string;
  toolName?: string;
  exposed: boolean;
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description?: string;
  }>;
}

/**
 * Schema field metadata for MCP
 */
export interface SchemaFieldMetadata {
  name: string;
  type: string;
  description?: string;
  mcpDescription?: string;
  required?: boolean;
  enum?: any[];
  default?: any;
  constraints?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

/**
 * Model metadata for MCP
 */
export interface ModelMetadata {
  name: string;
  collection?: string;
  table?: string;
  fields: SchemaFieldMetadata[];
  description?: string;
  mcpDescription?: string;
}

/**
 * MCP server configuration
 */
export interface MCPServerConfig {
  name: string;
  version: string;
  transports: ('stdio' | 'http' | 'sse')[];
  stdio?: {
    enabled: boolean;
  };
  http?: {
    enabled: boolean;
    port?: number;
    host?: string;
  };
  sse?: {
    enabled: boolean;
    port?: number;
    host?: string;
  };
}

/**
 * MCP service registration function
 */
export type MCPServiceRegistration = (server: McpServer) => void | Promise<void>;

/**
 * MCP server instance
 */
export interface MCPServerInstance {
  server: McpServer;
  config: MCPServerConfig;
  start: () => Promise<void>;
  stop: () => Promise<void>;
}
