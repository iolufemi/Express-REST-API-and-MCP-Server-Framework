/**
 * Controllers MCP Tools
 * 
 * Exposes controller methods as MCP tools with selective exposure
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { discoverAllControllerMethods } from '../../utils/controller-discovery.js';
import { ControllerMethodMetadata } from '../../../types/mcp.js';

/**
 * Register controller tools with MCP server
 */
export async function registerControllerTools(_server: Server): Promise<void> {
  const controllerMethods = await discoverAllControllerMethods();

  controllerMethods.forEach((methodMeta: ControllerMethodMetadata) => {
    if (!methodMeta.exposed) {
      return;
    }

    // Tool handler would be registered here
    // The handler would call the actual controller method
    // @ts-ignore - Placeholder for future implementation
    const _tool: Tool = {
      name: methodMeta.toolName || methodMeta.name,
      description: methodMeta.description || `Execute ${methodMeta.methodName} on ${methodMeta.name}`,
      inputSchema: {
        type: 'object',
        properties: generateSchemaFromParameters(methodMeta.parameters || []),
        required: methodMeta.parameters?.filter(p => p.required).map(p => p.name) || []
      }
    };
  });
}

/**
 * Generate JSON schema from method parameters
 */
function generateSchemaFromParameters(parameters: Array<{ name: string; type: string; required: boolean; description?: string }>): Record<string, any> {
  const properties: Record<string, any> = {};

  parameters.forEach((param) => {
    properties[param.name] = {
      type: mapTypeToJSONSchema(param.type),
      description: param.description
    };
  });

  return properties;
}

/**
 * Map parameter type to JSON schema type
 */
function mapTypeToJSONSchema(type: string): string {
  const typeMap: Record<string, string> = {
    'string': 'string',
    'number': 'number',
    'boolean': 'boolean',
    'object': 'object',
    'array': 'array'
  };

  return typeMap[type.toLowerCase()] || 'string';
}
