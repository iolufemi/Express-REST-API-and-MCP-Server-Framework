/**
 * MCP Routes
 * 
 * Routes for MCP server configuration and information
 */

import express, { Router } from 'express';
import MCPConfigController from '../controllers/MCPConfig.js';

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

export default router;
