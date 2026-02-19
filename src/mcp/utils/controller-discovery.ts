/**
 * Controller Discovery System
 * 
 * Discovers and parses controller methods with MCP annotations
 */

import fs from 'fs';
import path from 'path';
import { ControllerMethodMetadata } from '../../types/mcp.js';
import { getControllerMethodMetadata } from './mcp-annotations.js';

/**
 * Discover all controller files
 */
export function discoverControllerFiles(controllersDir: string = path.join(__dirname, '../../controllers')): string[] {
  try {
    const files = fs.readdirSync(controllersDir);
    return files
      .filter(file => file.endsWith('.ts') || file.endsWith('.js'))
      .filter(file => file !== 'index.ts' && file !== 'index.js')
      .map(file => path.join(controllersDir, file));
  } catch (error) {
    console.error('Error discovering controller files:', error);
    return [];
  }
}

/**
 * Discover MCP-exposed methods in a controller
 */
export async function discoverControllerMethods(controllerPath: string): Promise<ControllerMethodMetadata[]> {
  const metadata: ControllerMethodMetadata[] = [];
  
  try {
    // Dynamically import the controller (ES modules)
    const controllerModule = await import(controllerPath.replace(/\.ts$/, '.js'));
    const controller = controllerModule.default || controllerModule;
    const controllerName = path.basename(controllerPath, path.extname(controllerPath));

    // Iterate through controller methods
    for (const methodName in controller) {
      if (typeof controller[methodName] === 'function') {
        const method = controller[methodName];
        const methodMeta = getControllerMethodMetadata(controllerName, methodName, method);
        
        if (methodMeta) {
          metadata.push(methodMeta);
        } else if (isDefaultCRUDMethod(methodName)) {
          // Auto-expose default CRUD methods
          metadata.push({
            name: controllerName,
            methodName: methodName,
            description: `Default ${methodName} operation for ${controllerName}`,
            toolName: `${controllerName}_${methodName}`,
            exposed: true,
            parameters: []
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error discovering methods in controller ${controllerPath}:`, error);
  }

  return metadata;
}

/**
 * Discover all MCP-exposed controller methods across all controllers
 */
export async function discoverAllControllerMethods(controllersDir?: string): Promise<ControllerMethodMetadata[]> {
  const controllerFiles = discoverControllerFiles(controllersDir);
  const allMetadata: ControllerMethodMetadata[] = [];

  for (const file of controllerFiles) {
    const metadata = await discoverControllerMethods(file);
    allMetadata.push(...metadata);
  }

  return allMetadata;
}

/**
 * Get default CRUD methods that should be auto-exposed
 */
export function getDefaultCRUDMethods(): string[] {
  return [
    'find',
    'findOne',
    'create',
    'update',
    'updateOne',
    'delete',
    'deleteOne',
    'restore'
  ];
}

/**
 * Check if a method is a default CRUD method (auto-exposed)
 */
export function isDefaultCRUDMethod(methodName: string): boolean {
  return getDefaultCRUDMethods().includes(methodName);
}
