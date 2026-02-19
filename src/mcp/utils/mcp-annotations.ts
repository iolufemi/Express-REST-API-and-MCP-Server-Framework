/**
 * MCP Annotation Parser
 * 
 * Parses JSDoc annotations to extract MCP exposure metadata
 */

import { MCPExposureAnnotation, ControllerMethodMetadata } from '../../types/mcp.js';

/**
 * Parse JSDoc comment for MCP annotations
 */
export function parseMCPAnnotations(jsdocComment: string): MCPExposureAnnotation | null {
  if (!jsdocComment) {
    return null;
  }

  const exposeMatch = jsdocComment.match(/@mcp\.expose\s+(true|false)/);
  const toolNameMatch = jsdocComment.match(/@mcp\.toolName\s+(\w+)/);
  const descriptionMatch = jsdocComment.match(/@mcp\.description\s+(.+?)(?:\n|$)/);
  const resourceURIMatch = jsdocComment.match(/@mcp\.resourceURI\s+(\S+)/);

  if (!exposeMatch || exposeMatch[1] !== 'true') {
    return null;
  }

  return {
    expose: true,
    toolName: toolNameMatch ? toolNameMatch[1] : undefined,
    description: descriptionMatch ? descriptionMatch[1].trim() : undefined,
    resourceURI: resourceURIMatch ? resourceURIMatch[1] : undefined
  };
}

/**
 * Extract JSDoc comment from a function
 */
export function extractJSDocComment(func: Function): string | null {
  const funcStr = func.toString();
  const jsdocMatch = funcStr.match(/\/\*\*([\s\S]*?)\*\//);
  return jsdocMatch ? jsdocMatch[1] : null;
}

/**
 * Get MCP metadata for a controller method
 */
export function getControllerMethodMetadata(
  controllerName: string,
  methodName: string,
  method: Function
): ControllerMethodMetadata | null {
  const jsdoc = extractJSDocComment(method);
  if (!jsdoc) {
    return null;
  }

  const annotation = parseMCPAnnotations(jsdoc);
  if (!annotation || !annotation.expose) {
    return null;
  }

  return {
    name: methodName,
    methodName: methodName,
    description: annotation.description,
    toolName: annotation.toolName || `${controllerName}_${methodName}`,
    exposed: true,
    parameters: [] // Would be extracted from function signature or JSDoc @param tags
  };
}
