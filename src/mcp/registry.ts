/**
 * MCP Service Registry
 * 
 * Registry system for auto-registering generated services with MCP
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { MCPServiceRegistration } from '../types/mcp.js';
import log from '../services/logger/index.js';

/** HTTP transport that can handle Express req/res for Streamable HTTP */
export interface MCPHttpTransport {
  handleRequest(req: IncomingMessage, res: ServerResponse, parsedBody?: unknown): Promise<void>;
}

interface ServiceRegistration {
  serviceName: string;
  registration: MCPServiceRegistration;
  registered: boolean;
}

class MCPServiceRegistry {
  private registrations: Map<string, ServiceRegistration> = new Map();
  private server: McpServer | null = null;
  private httpTransport: MCPHttpTransport | null = null;

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

  /**
   * Set the Streamable HTTP transport (used by /mcp/http route)
   */
  setHttpTransport(transport: MCPHttpTransport | null): void {
    this.httpTransport = transport;
  }

  /**
   * Get the Streamable HTTP transport, or null if not set
   */
  getHttpTransport(): MCPHttpTransport | null {
    return this.httpTransport;
  }
}

// Singleton instance
export const mcpRegistry = new MCPServiceRegistry();

export default mcpRegistry;
