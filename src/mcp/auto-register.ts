/**
 * Auto-Registration System
 * 
 * Automatically discovers and registers MCP services from generated service files
 */

import fs from 'fs';
import path from 'path';
import mcpRegistry from './registry.js';
import log from '../services/logger/index.js';

/**
 * Auto-discover and register MCP services from a directory
 */
export async function autoRegisterServices(servicesDir: string = path.join(__dirname, './services')): Promise<void> {
  try {
    if (!fs.existsSync(servicesDir)) {
      log.info(`MCP services directory does not exist: ${servicesDir}`);
      return;
    }

    const files = fs.readdirSync(servicesDir);
    const serviceFiles = files.filter(file => 
      file.endsWith('.ts') || file.endsWith('.js')
    );

    for (const file of serviceFiles) {
      const serviceName = path.basename(file, path.extname(file));
      const filePath = path.join(servicesDir, file);

      try {
        // Dynamically require the service registration
        const serviceModule = require(filePath);
        const registration = serviceModule.default || serviceModule.register;

        if (typeof registration === 'function') {
          mcpRegistry.register(serviceName, registration);
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
