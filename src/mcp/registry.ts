/**
 * MCP Service Registry
 * 
 * Registry system for auto-registering generated services with MCP
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { MCPServiceRegistration } from '../types/mcp.js';
import log from '../services/logger/index.js';

interface ServiceRegistration {
  serviceName: string;
  registration: MCPServiceRegistration;
  registered: boolean;
}

class MCPServiceRegistry {
  private registrations: Map<string, ServiceRegistration> = new Map();
  private server: McpServer | null = null;

  /**
   * Register a service with the MCP server
   */
  register(serviceName: string, registration: MCPServiceRegistration): void {
    this.registrations.set(serviceName, {
      serviceName,
      registration,
      registered: false
    });

    // If server is already set, register immediately
    if (this.server) {
      this.applyRegistration(serviceName);
    }
  }

  /**
   * Set the MCP server and register all pending services
   */
  setServer(server: McpServer): void {
    this.server = server;
    this.registrations.forEach((reg, serviceName) => {
      if (!reg.registered) {
        this.applyRegistration(serviceName);
      }
    });
  }

  /**
   * Apply a registration to the server
   */
  private async applyRegistration(serviceName: string): Promise<void> {
    const reg = this.registrations.get(serviceName);
    if (!reg || !this.server) {
      return;
    }

    try {
      await reg.registration(this.server);
      reg.registered = true;
      log.info(`MCP service registered: ${serviceName}`);
    } catch (error) {
      log.error(`Error registering MCP service ${serviceName}:`, error);
    }
  }

  /**
   * Unregister a service
   */
  unregister(serviceName: string): void {
    this.registrations.delete(serviceName);
    log.info(`MCP service unregistered: ${serviceName}`);
  }

  /**
   * Get all registered services
   */
  getRegisteredServices(): string[] {
    return Array.from(this.registrations.keys());
  }
}

// Singleton instance
export const mcpRegistry = new MCPServiceRegistry();

export default mcpRegistry;
