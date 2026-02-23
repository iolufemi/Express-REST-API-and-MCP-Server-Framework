/**
 * Auto-Registration System
 * 
 * Automatically discovers and registers MCP services from generated service files
 */

import fs from 'fs';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';
import mcpRegistry from './registry.js';
import log from '../services/logger/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Auto-discover and register MCP services from a directory
 */
export async function autoRegisterServices(servicesDir: string = path.join(__dirname, 'services')): Promise<void> {
  try {
    if (!fs.existsSync(servicesDir)) {
      log.info(`MCP services directory does not exist: ${servicesDir}`);
      return;
    }

    const files = fs.readdirSync(servicesDir);
    const serviceFiles = files.filter(
      (file) =>
        (file.endsWith('.js') || file.endsWith('.ts')) &&
        !file.endsWith('.d.ts')
    );

    for (const file of serviceFiles) {
      const serviceName = path.basename(file, path.extname(file));

      try {
        const absolutePath = path.resolve(servicesDir, file);
        const serviceModule = await import(pathToFileURL(absolutePath).href);
        const registration = (serviceModule as { default?: unknown; register?: unknown }).default
          ?? (serviceModule as { default?: unknown; register?: unknown }).register;

        if (typeof registration === 'function') {
          mcpRegistry.register(serviceName, registration as Parameters<typeof mcpRegistry.register>[1]);
          log.info(`Auto-registered MCP service: ${serviceName}`);
        } else {
          log.warn(`Service file ${file} does not export a registration function`);
        }
      } catch (error) {
        log.error(`Error loading MCP service from ${file}:`, error);
      }
    }
  } catch (error) {
    log.error('Error during auto-registration:', error);
  }
}

/**
 * Register a service manually
 */
import type { MCPServiceRegistration } from '../types/mcp.js';

export function registerService(serviceName: string, registration: MCPServiceRegistration): void {
  mcpRegistry.register(serviceName, registration);
}
