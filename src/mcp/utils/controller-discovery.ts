/**
 * Controller Discovery System
 * 
 * Discovers and parses controller methods with MCP annotations
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { ControllerMethodMetadata } from '../../types/mcp.js';
import { getControllerMethodMetadata } from './mcp-annotations.js';

/** When running from dist/, use dist/controllers so dynamic import resolves to compiled .js */
function defaultControllersDir(): string {
  const thisDir = path.dirname(fileURLToPath(import.meta.url));
  const cwd = process.cwd();
  const rel = path.relative(cwd, thisDir);
  const inDist = rel === 'dist' || rel.startsWith('dist' + path.sep);
  return path.join(cwd, inDist ? 'dist' : 'src', 'controllers');
}

/**
 * Discover all controller files.
 * Uses dist/controllers when running from compiled code (e.g. node dist/app.js), else src/controllers.
 */
export function discoverControllerFiles(controllersDir?: string): string[] {
  const resolved = controllersDir ?? defaultControllersDir();
  try {
    const files = fs.readdirSync(resolved);
    return files
      .filter(file => (file.endsWith('.ts') || file.endsWith('.js')) && !file.endsWith('.d.ts'))
      .filter(file => file !== 'index.ts' && file !== 'index.js')
      .map(file => path.join(resolved, file));
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
    // Dynamically import the controller (ES modules). Use file:// URL for absolute paths (Node ESM).
    const importPath = controllerPath.replace(/\.ts$/, '.js');
    const moduleUrl = path.isAbsolute(importPath) ? pathToFileURL(importPath).href : importPath;
    const controllerModule = await import(moduleUrl);
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
