/**
 * MCP Routes
 * 
 * Routes for MCP server configuration, information, and Streamable HTTP transport
 */

import express, { Router } from 'express';
import MCPConfigController from '../controllers/MCPConfig.js';
import mcpRegistry from '../mcp/registry.js';

const router: Router = express.Router();

/**
 * Generate MCP client configuration
 * GET /mcp/config
 * 
 * Query parameters:
 * - format: 'claude' | 'chatgpt' | 'generic' (default: 'generic')
 * - transport: 'http' | 'sse' (default: 'http')
 * - baseUrl: Override base URL
 * - download: 'true' to download as file
 * 
 * Example:
 * GET /mcp/config?format=claude&transport=http&download=true
 * GET /mcp/config?format=chatgpt&baseUrl=https://api.example.com
 */
router.get('/config', MCPConfigController.generateConfig);

/**
 * Get MCP server information
 * GET /mcp/info
 * 
 * Returns information about available tools, resources, and services
 */
router.get('/info', MCPConfigController.getInfo);

/**
 * MCP Streamable HTTP transport endpoint
 * GET/POST /mcp/http
 * 
 * Used by Cursor and other MCP clients that connect via URL.
 * Requires config.enableMcp (ENABLE_MCP=true or NODE_ENV=development) and a running API server.
 */
router.all('/http', async (req, res, next) => {
  try {
    const transport = mcpRegistry.getHttpTransport();
    if (!transport) {
      res.status(503).set('Content-Type', 'application/json').json({
        error: 'MCP server not ready',
        message: 'Ensure the API server is running and MCP is enabled (config.enableMcp: set ENABLE_MCP=true or NODE_ENV=development).'
      });
      return;
    }
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    next(err);
  }
});

export default router;
