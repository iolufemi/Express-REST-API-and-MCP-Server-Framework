/**
 * Example MCP Client Implementation
 *
 * Connects to the MCP server from a client application.
 * - Run from project root. For STDIO, run `npm run build` first so `dist/app.js` exists.
 * - Tool and resource names (e.g. create_users, users://list) depend on your generated services.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function main() {
  // Create MCP client
  const client = new Client(
    {
      name: 'example-mcp-client',
      version: '1.0.0'
    },
    {
      capabilities: {}
    }
  );

  // Connect via STDIO
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['dist/app.js']
  });

  await client.connect(transport);

  // List available tools
  const tools = await client.listTools();
  console.log('Available tools:', tools);

  // List available resources
  const resources = await client.listResources();
  console.log('Available resources:', resources);

  // Call a tool
  const result = await client.callTool({
    name: 'create_users',
    arguments: {
      name: 'John Doe',
      email: 'john@example.com'
    }
  });

  console.log('Tool result:', result);

  // Read a resource
  const resource = await client.readResource({
    uri: 'users://list'
  });

  console.log('Resource content:', resource);

  await client.close();
}

main().catch(console.error);
