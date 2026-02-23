/**
 * MCP Configuration Controller
 * 
 * Generates MCP client configuration files for LLM clients
 */

import { ExpressRequest, ExpressResponse, ExpressNext } from '../types/express.js';
import config from '../config/index.js';
import pkg from '../../package.json' with { type: 'json' };
import { discoverAllControllerMethods } from '../mcp/utils/controller-discovery.js';
import { getAllModelMetadata } from '../mcp/utils/model-metadata.js';
import mcpRegistry from '../mcp/registry.js';
import log from '../services/logger/index.js';
import { isDefaultCRUDMethod } from '../mcp/utils/controller-discovery.js';

const MCPConfigController = {
  /**
   * Generate MCP client configuration JSON
   * GET /mcp/config
   * 
   * Query parameters:
   * - format: 'claude' | 'chatgpt' | 'generic' (default: 'generic')
   * - transport: 'http' | 'sse' (default: 'http')
   * - baseUrl: Override base URL (default: from request or config)
   * - download: 'true' to download as file (default: false)
   * 
   * Returns JSON configuration file for MCP client setup
   */
  generateConfig: async function(
    req: ExpressRequest,
    res: ExpressResponse,
    next: ExpressNext
  ): Promise<void> {
    try {
      const format = (req.query.format as string) || 'generic';
      const transport = (req.query.transport as string) || 'http';
      const download = req.query.download === 'true';
      
      // Determine base URL
      let baseUrl = req.query.baseUrl as string;
      if (!baseUrl) {
        // Try to get from request
        const protocol = req.protocol || 'https';
        const host = req.get('host') || `localhost:${config.port}`;
        baseUrl = `${protocol}://${host}`;
      }

      // Remove trailing slash
      baseUrl = baseUrl.replace(/\/$/, '');

      // Get MCP server information
      const registeredServices = mcpRegistry.getRegisteredServices();
      const controllerMethods = await discoverAllControllerMethods();
      const modelMetadata = await getAllModelMetadata();

      // Build tools list (include both exposed methods and default CRUD methods)
      const tools = controllerMethods
        .filter(method => method.exposed || isDefaultCRUDMethod(method.methodName))
        .map(method => ({
          name: method.toolName || `${method.name}_${method.methodName}`,
          description: method.description || `Execute ${method.methodName} on ${method.name}`,
          parameters: method.parameters || []
        }));

      // Build resources list
      const resources = modelMetadata.flatMap(model => [
        {
          uri: `${model.name.toLowerCase()}://list`,
          name: `List ${model.name}`,
          description: `List all ${model.name} records`,
          mimeType: 'application/json'
        },
        {
          uri: `${model.name.toLowerCase()}://{id}`,
          name: `Get ${model.name} by ID`,
          description: `Get a specific ${model.name} record by ID`,
          mimeType: 'application/json'
        },
        {
          uri: `${model.name.toLowerCase()}://search`,
          name: `Search ${model.name}`,
          description: `Search ${model.name} records`,
          mimeType: 'application/json'
        }
      ]);

      // Determine MCP endpoint URL
      const mcpEndpoint = transport === 'sse' 
        ? `${baseUrl}/mcp/sse`
        : `${baseUrl}/mcp/http`;

      // Generate configuration based on format
      let mcpConfig: Record<string, unknown>;

      switch (format) {
        case 'claude':
          // Claude Desktop configuration format
          mcpConfig = {
            mcpServers: {
              [config.mcpServerName]: {
                command: 'node',
                args: ['-e', `require('@modelcontextprotocol/sdk/client/index.js').Client.connect({url: '${mcpEndpoint}'})`],
                env: {
                  MCP_SERVER_URL: mcpEndpoint,
                  MCP_TRANSPORT: transport
                }
              }
            }
          };
          break;

        case 'chatgpt':
          // ChatGPT/OpenAI configuration format
          mcpConfig = {
            mcpServers: {
              [config.mcpServerName]: {
                type: transport,
                url: mcpEndpoint,
                env: {
                  MCP_SERVER_URL: mcpEndpoint,
                  MCP_TRANSPORT: transport
                }
              }
            }
          };
          break;

        case 'generic':
        default:
          // Generic MCP configuration format
          mcpConfig = {
            name: config.mcpServerName,
            version: pkg.version,
            transport: {
              type: transport,
              url: mcpEndpoint
            },
            capabilities: {
              tools: {
                count: tools.length,
                list: tools.map(t => t.name)
              },
              resources: {
                count: resources.length,
                list: resources.map(r => r.uri)
              }
            },
            server: {
              name: config.mcpServerName,
              version: pkg.version,
              description: `MCP server (${config.mcpServerName})`,
              baseUrl: baseUrl,
              endpoint: mcpEndpoint
            },
            services: registeredServices,
            tools: tools,
            resources: resources,
            env: {
              MCP_SERVER_URL: mcpEndpoint,
              MCP_TRANSPORT: transport,
              BASE_URL: baseUrl
            },
            instructions: {
              setup: [
                '1. Copy this configuration file',
                '2. Add it to your LLM client\'s MCP configuration directory',
                `3. Ensure your client supports ${transport.toUpperCase()} transport`,
                '4. Restart your LLM client',
                '5. The MCP server will be available for use'
              ],
              usage: [
                'Use the available tools to interact with your API',
                'Access resources to read data from your models',
                'All CRUD operations are available as tools'
              ]
            }
          };
          break;
      }

      // Set response headers
      if (download) {
        const filename = `mcp-config-${format}-${Date.now()}.json`;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      } else {
        res.setHeader('Content-Type', 'application/json');
      }

      res.status(200).json(mcpConfig);
    } catch (err: unknown) {
      log.error('Error generating MCP config:', err);
      next(err instanceof Error ? err : new Error(String(err)));
    }
  },

  /**
   * Get MCP server information
   * GET /mcp/info
   * 
   * Returns information about the MCP server including available tools and resources
   */
  getInfo: async function(
    _req: ExpressRequest,
    res: ExpressResponse,
    next: ExpressNext
  ): Promise<void> {
    try {
      const registeredServices = mcpRegistry.getRegisteredServices();
      const controllerMethods = await discoverAllControllerMethods();
      const modelMetadata = await getAllModelMetadata();

      const info = {
        server: {
          name: config.mcpServerName,
          version: pkg.version,
          description: `MCP server (${config.mcpServerName})`,
          enabled: config.enableMcp
        },
        services: {
          count: registeredServices.length,
          list: registeredServices
        },
        tools: {
          count: controllerMethods.filter(m => m.exposed).length,
          list: controllerMethods
            .filter(method => method.exposed)
            .map(method => ({
              name: method.toolName || method.name,
              description: method.description,
              controller: method.name,
              method: method.methodName
            }))
        },
        resources: {
          count: modelMetadata.length * 3, // list, {id}, search for each model
          models: modelMetadata.map(model => ({
            name: model.name,
            description: model.description,
            uris: [
              `${model.name.toLowerCase()}://list`,
              `${model.name.toLowerCase()}://{id}`,
              `${model.name.toLowerCase()}://search`
            ]
          }))
        },
        transports: {
          available: ['http', 'sse'],
          recommended: 'http',
          note: 'STDIO transport is for local development only'
        }
      };

      res.status(200).json(info);
    } catch (err: unknown) {
      log.error('Error getting MCP info:', err);
      next(err instanceof Error ? err : new Error(String(err)));
    }
  }
};

export default MCPConfigController;
