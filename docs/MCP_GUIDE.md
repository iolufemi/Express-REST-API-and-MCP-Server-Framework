# MCP (Model Context Protocol) Integration Guide

## Table of Contents

1. [Overview](#overview)
2. [What is MCP?](#what-is-mcp)
3. [Architecture](#architecture)
4. [Configuration](#configuration)
5. [Service Registration](#service-registration)
6. [Exposing Controller Methods](#exposing-controller-methods)
7. [Exposing Model Data](#exposing-model-data)
8. [Custom Service Registration](#custom-service-registration)
9. [MCP Transports](#mcp-transports)
10. [Usage Examples](#usage-examples)
11. [Troubleshooting](#troubleshooting)

## Overview

The Express REST API and MCP Server Framework provides built-in MCP (Model Context Protocol) server support, enabling Large Language Models (LLMs) to interact with your API directly through resources and tools. This allows AI assistants to understand your data models, execute operations, and access your API functionality programmatically.

## What is MCP?

The Model Context Protocol (MCP) is a standardized protocol that allows AI assistants to:
- **Discover** available data models and operations
- **Query** data through resources (read-only access)
- **Execute** operations through tools (read-write access)
- **Understand** schema structures and field descriptions

MCP enables AI assistants to:
- Understand your API structure without manual documentation
- Execute CRUD operations on your data
- Access model metadata and field descriptions
- Discover available operations automatically

## Architecture

The MCP implementation consists of three main server types:

### 1. Models MCP Server
Exposes model data as **resources** and **tools** (model name is lowercased, e.g. `Items` → `items`):
- **Resources**: Read-only — `<model>://list` (with `?limit=&skip=`, `pagination.nextPageUri`), `<model>://{id}`, `<model>://search` (e.g. `?q=...` or `?query=...`)
- **Tools**: `create_<model>`, `create_many_<model>` (payload `{ "items": [ ... ] }`), `update_<model>`, `delete_<model>`

**Location**: `src/mcp/servers/models/`

### 2. Controllers MCP Server
Exposes controller methods as **tools**:
- All CRUD operations from controllers
- Custom controller methods (with annotations)
- Method parameters and descriptions

**Location**: `src/mcp/servers/controllers/`

### 3. Services MCP Server
Exposes service-level operations (placeholder for future implementation):
- Service methods as tools
- Service resources

**Location**: `src/mcp/servers/services/`

### Unified MCP Server

All three servers are combined into a **Unified MCP Server** that provides a single interface for accessing all capabilities:

```typescript
import { createUnifiedMCPServer } from './mcp/servers/unified.js';

// Standalone process with STDIO (e.g. CLI):
const mcpServer = createUnifiedMCPServer({
  name: 'my-api-mcp',
  version: '1.0.0',
  transports: ['stdio'],
  stdio: { enabled: true }
});

// In this framework's Express app (src/app.ts), MCP uses HTTP only: transports: ['http'], and
// Streamable HTTP is attached at /mcp/http (no call to start()).
```

## Configuration

### Environment Variables

Configure MCP servers using environment variables:

```bash
# Enable MCP initialization (default: enabled in development)
ENABLE_MCP=true

# Start MCP server with STDIO transport
START_MCP_SERVER=true

# MCP server name (used in Cursor, /mcp/config, and /mcp/info)
MCP_SERVER_NAME=express-api-framework-mcp
```

### Programmatic Configuration

Configure MCP servers programmatically in your application.

**In this framework's Express app** (`src/app.ts`), MCP is configured with **HTTP only**; the app attaches Streamable HTTP at `/mcp/http` and does not call `mcpServer.start()`:

```typescript
// What the Express app uses (HTTP only)
const mcpConfig: MCPServerConfig = {
  name: config.mcpServerName,
  version: pkg.version,
  transports: ['http'],
  http: { enabled: true }
};
const mcpServer = await createUnifiedMCPServer(mcpConfig);
// Then: mcpServer.server.connect(streamableHttpTransport) for /mcp/http
```

**Standalone process** (e.g. CLI with STDIO, or your own script that calls `start()`):

```typescript
const mcpConfig: MCPServerConfig = {
  name: 'my-api-mcp',
  version: '1.0.0',
  transports: ['stdio'],  // or ['http'], ['sse']
  stdio: { enabled: true },
  http: { enabled: false },
  sse: { enabled: false }
};
const mcpServer = createUnifiedMCPServer(mcpConfig);
await mcpServer.start();
```

### Application Integration

MCP servers are automatically initialized when the application starts when **`config.enableMcp`** is true (i.e. `ENABLE_MCP=true` or `NODE_ENV=development`):

```typescript
// In src/app.ts
if (config.enableMcp) {
  initializeMCPServers().catch((err) => {
    log.error('Error initializing MCP servers:', err);
  });
}
```

## Service Registration

### Automatic Registration

When you generate a new service using `npm run generate -- --name YourService`, the framework automatically:

1. **Creates the service files**:
   - Model (`src/models/{Service}.ts`)
   - Controller (`src/controllers/{Service}.ts`)
   - Routes (`src/routes/{service}.ts`)

2. **Generates MCP registration file**:
   - `src/mcp/services/{service}.registration.ts`

3. **Registers with MCP registry**:
   - Service is automatically discovered and registered
   - All CRUD operations are exposed as MCP tools

### Registration File Structure

Each service has a registration file in `src/mcp/services/`:

```typescript
/**
 * MCP Service Registration for Product
 * 
 * Auto-generated MCP service registration file
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

export default async function registerProductService(_server: Server): Promise<void> {
  // MCP registration is handled automatically by the auto-registration system
  // Service-specific MCP configurations can be added here in the future
}
```

### Manual Service Registration

You can manually register services using the MCP registry:

```typescript
import mcpRegistry from './mcp/registry.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

async function registerMyService(server: Server): Promise<void> {
  // Register custom tools, resources, or prompts
  // ...
}

// Register the service
mcpRegistry.register('my-service', registerMyService);
```

## Exposing Controller Methods

### Automatic Exposure

Model-level operations are exposed as **standard MCP tools** (model name lowercased):

- **`create_<model>`** — Create one record
- **`create_many_<model>`** — Bulk create (arguments: `{ "items": [ {...}, {...} ] }`)
- **`update_<model>`** — Update a record by id and data
- **`delete_<model>`** — Delete a record by id

Additional controller methods (find, findOne, update, delete, restore, etc.) can be exposed as tools via the controller MCP server and JSDoc annotations (see [Custom Method Exposure](#custom-method-exposure)).

### Custom Method Exposure

To expose custom controller methods, add JSDoc annotations:

```typescript
/**
 * Send a welcome email to a user
 * @mcp.expose true
 * @mcp.toolName sendWelcomeEmail
 * @mcp.description Send a welcome email to a user after registration
 */
UsersController.sendWelcomeEmail = async function(
  req: ExpressRequest,
  res: ExpressResponse,
  next: ExpressNext
): Promise<void> {
  // Your custom method implementation
  const userId = req.params.id;
  // ... send email logic
  res.ok?.({ message: 'Email sent' });
};
```

### Annotation Options

- `@mcp.expose true` - **Required**: Exposes the method as an MCP tool
- `@mcp.toolName {name}` - **Optional**: Custom tool name (default: `{controller}_{method}`)
- `@mcp.description {text}` - **Optional**: Tool description for LLMs

### Example: Complete Controller Method

```typescript
const ProductsController = {
  /**
   * Find and list Product records with optional filtering, pagination, sorting, and full-text search
   * @mcp.expose true
   * @mcp.toolName findProducts
   * @mcp.description Find and list Product records with optional filtering, pagination, sorting, and full-text search
   */
  find: async function(
    req: ExpressRequest,
    res: ExpressResponse,
    next: ExpressNext
  ): Promise<void> {
    try {
      // Implementation
      const query = buildQuery(req);
      const results = await Model.find(query);
      res.ok?.(results);
    } catch (err: any) {
      next(err);
    }
  }
};
```

## Exposing Model Data

### Schema Field Descriptions

Add `description` and `mcpDescription` fields to your model schemas for better LLM understanding:

```typescript
// MongoDB Model
const schemaObject: Record<string, any> = {
  name: {
    type: String,
    required: true,
    description: 'The full name of the user',
    mcpDescription: 'User\'s full name (first and last name combined). Used for display and identification.'
  },
  email: {
    type: String,
    required: true,
    unique: true,
    description: 'User\'s email address',
    mcpDescription: 'Unique email address used for login, authentication, and communication. Must be a valid email format.'
  },
  age: {
    type: Number,
    min: 0,
    max: 150,
    description: 'User age in years',
    mcpDescription: 'Age of the user in years. Must be between 0 and 150. Used for age verification and demographic analysis.'
  }
};
```

```typescript
// SQL Model (Sequelize)
const schemaObject: Record<string, any> = {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    description: 'The full name of the user',
    mcpDescription: 'User\'s full name (first and last name combined). Used for display and identification.'
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    description: 'User\'s email address',
    mcpDescription: 'Unique email address used for login, authentication, and communication. Must be a valid email format.'
  }
};
```

### Model Metadata

The framework automatically extracts model metadata including:
- Model name and collection/table name
- Field names, types, and constraints
- Field descriptions and MCP descriptions
- Required fields and default values
- Enum values and validation rules

### Schema Endpoints

Every generated service exposes a **schema endpoint** that returns the model's metadata in a consistent JSON shape for MCP and API consumers:

- **`GET /{service}/schema`** — Returns schema metadata (name, fields array, description, mcpDescription, and optionally collection/table).

Examples:
- `GET /products/schema` — Schema for the Products model
- `GET /orders/schema` — Schema for the Orders model
- `GET /externaldatas/schema` — Schema for the Externaldatas (API) model

**Response shape** (matches `ModelMetadata`):
- `name` — Model name
- `fields` — Array of field metadata (name, type, description, mcpDescription, required, etc.)
- `description` — Optional model-level description
- `mcpDescription` — Optional model-level MCP description
- `collection` — MongoDB collection name (if applicable)
- `table` — SQL table name (if applicable)

Use this endpoint to let MCP clients and LLMs discover the structure of your data at runtime.

### Auto-Discovery for API Models

For **API-based models** (generated with `--baseurl` and `--endpoint`), the schema endpoint supports **automatic schema discovery**:

1. The controller first tries to fetch the schema from the external API: **`GET {baseurl}/{endpoint}/schema`**.
2. If the external API returns a valid JSON Schema (with `properties`), it is converted to the internal metadata format and returned.
3. If the request fails (no schema endpoint, network error, or invalid response), the controller **falls back to the existing `_schema`** defined in the model file (the `schemaObject` you maintain in the API model).
4. If the model has neither discovery nor `_schema`, the response is minimal (`name` and empty `fields` array) or 404.

No file writing is performed; discovery is read-only. Define and maintain the `schemaObject` in your API model file so that MCP has context even when the external API does not expose a `/schema` endpoint.

### MCP Resources

Model data is exposed as MCP resources with the following URI patterns (model name is lowercased, e.g. `Products` → `products`):

- **`{model}://list`** — List records (optional `?limit=N&skip=M`; response includes `pagination.nextPageUri`)
- **`{model}://{id}`** — Get one record by id
- **`{model}://search`** — Search (e.g. `?q=...` or `?query=...`)

Example for a generated `Products` model:
- `products://list` — List products
- `products://507f1f77bcf86cd799439011` — Get product by ID
- `products://search?q=laptop` — Search products

#### List pagination

To load the next page when listing, use query parameters on the list resource:

- **First page:** `{model}://list?limit=20&skip=0` (or `{model}://list` for default limit 50, skip 0)
- **Next page:** `{model}://list?limit=20&skip=20`
- **Page N:** `{model}://list?limit=20&skip=${(N-1)*20}`

The list response includes a `pagination` object so the client can request the next page without computing it:

```json
{
  "data": [...],
  "metadata": { "model": "Items", "fields": [...], "total": 100, "limit": 20, "skip": 0 },
  "pagination": {
    "limit": 20,
    "skip": 0,
    "total": 100,
    "hasMore": true,
    "nextPageUri": "item://list?limit=20&skip=20"
  }
}
```

- Use `pagination.nextPageUri` as the resource URI to load the next page (when `hasMore` is true).
- Or compute the next request as the same list URI with `skip` set to `skip + limit`.

#### Bulk create (tools)

To create many records in one call, the MCP client calls the **`create_many_{model}`** tool with an `items` array:

- **Tool name:** `create_many_items`, `create_many_foods`, etc. (one per model).
- **Arguments:** `{ "items": [ { "name": "a", ... }, { "name": "b", ... } ] }`.
- **Response:** `{ "created": N, "data": [ ... ] }` with the created records.

Example (tools/call):

```json
{
  "name": "create_many_items",
  "arguments": {
    "items": [
      { "name": "First", "someOtherStringData": "x" },
      { "name": "Second", "someOtherStringData": "y" }
    ]
  }
}
```

Single-record create remains available via the `create_{model}` tool (e.g. `create_items`).

## Custom Service Registration

### Creating a Custom Service Registration

Create a custom registration file in `src/mcp/services/`:

```typescript
/**
 * Custom MCP Service Registration
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { Tool } from '@modelcontextprotocol/sdk/types.js';

export default async function registerCustomService(server: Server): Promise<void> {
  // Register custom tools
  await server.setRequestHandler('tools/list', async () => {
    return {
      tools: [
        {
          name: 'custom_operation',
          description: 'Perform a custom operation',
          inputSchema: {
            type: 'object',
            properties: {
              param1: { type: 'string', description: 'First parameter' },
              param2: { type: 'number', description: 'Second parameter' }
            },
            required: ['param1']
          }
        }
      ]
    };
  });

  // Register tool handler
  await server.setRequestHandler('tools/call', async (request) => {
    if (request.params.name === 'custom_operation') {
      const { param1, param2 } = request.params.arguments as any;
      // Perform custom operation
      return { result: `Operation completed with ${param1} and ${param2}` };
    }
    throw new Error('Unknown tool');
  });
}
```

### Auto-Discovery

The framework automatically discovers and registers services from `src/mcp/services/`:

```typescript
import { autoRegisterServices } from './mcp/auto-register.js';

// Auto-register all services in src/mcp/services/
await autoRegisterServices();
```

## MCP Transports

### STDIO Transport (Primary)

Standard input/output transport for local development and CLI tools:

```typescript
const mcpConfig: MCPServerConfig = {
  name: 'my-api-mcp',
  version: '1.0.0',
  transports: ['stdio'],
  stdio: {
    enabled: true
  }
};
```

**Usage**: Best for local development, CLI tools, and direct integration with AI assistants.

### HTTP Transport (Streamable HTTP)

The framework exposes the MCP **Streamable HTTP** transport on the same server as the REST API. When MCP is enabled (`config.enableMcp`), the endpoint **`GET/POST /mcp/http`** is available for Cursor and other MCP clients.

- **URL**: `http://localhost:8080/mcp/http` (or your server’s base URL + `/mcp/http`)
- **Cursor**: In MCP settings, add a server with `type: "http"` and `url: "http://localhost:8080/mcp/http"`. See [Connecting from Cursor](#connecting-from-cursor) below.
- **Config/info**: Use `GET /mcp/config` and `GET /mcp/info` for client setup and server capabilities.

### SSE Transport (Planned)

Server-Sent Events transport for real-time updates:

```typescript
const mcpConfig: MCPServerConfig = {
  name: 'my-api-mcp',
  version: '1.0.0',
  transports: ['sse'],
  sse: {
    enabled: true,
    port: 8082,
    host: 'localhost'
  }
};
```

**Status**: Placeholder for future implementation.

## Usage Examples

### Example 1: Basic Service Generation

Generate a new service with automatic MCP registration:

```bash
# Generate MongoDB service
npm run generate -- --name Product

# Generate SQL service
npm run generate -- --name Order --sql

# Generate API service
npm run generate -- --name ExternalData --baseurl http://localhost:8080 --endpoint products
```

This automatically:
- Creates model, controller, and routes
- Generates MCP registration file
- Exposes all CRUD operations as MCP tools

### Example 2: Custom Controller Method

Add a custom method with MCP exposure:

```typescript
const ProductsController = {
  // ... standard CRUD methods ...

  /**
   * Calculate total inventory value
   * @mcp.expose true
   * @mcp.toolName calculateInventoryValue
   * @mcp.description Calculate the total value of all products in inventory
   */
  calculateInventoryValue: async function(
    req: ExpressRequest,
    res: ExpressResponse,
    next: ExpressNext
  ): Promise<void> {
    try {
      const products = await Model.find({ inStock: true });
      const totalValue = products.reduce((sum, product) => {
        return sum + (product.price * product.quantity);
      }, 0);
      res.ok?.({ totalValue, currency: 'USD' });
    } catch (err: any) {
      next(err);
    }
  }
};
```

### Example 3: API Model Schema Definitions

For API-based models (generated with `--baseurl` and `--endpoint`), you need to define the schema manually since the data structure comes from an external API:

```typescript
// In src/models/Externaldatas.ts
import ApiModel from '../services/database/api.js';
import { SchemaFieldDefinition } from '../types/models.js';

const schemaObject: Record<string, SchemaFieldDefinition> = {
  id: {
    type: String,
    description: 'Unique identifier',
    mcpDescription: 'Unique identifier for the record returned from the external API'
  },
  title: {
    type: String,
    description: 'Product title',
    mcpDescription: 'The display name of the product from the external API. Used in product listings and search results.'
  },
  price: {
    type: Number,
    description: 'Product price',
    mcpDescription: 'The selling price of the product in USD. Must be a positive number. Used for pricing calculations.'
  },
  category: {
    type: String,
    enum: ['electronics', 'clothing', 'food', 'books'],
    description: 'Product category',
    mcpDescription: 'The category this product belongs to. Used for filtering and navigation. Must be one of: electronics, clothing, food, books.'
  }
};

// Attach schema to the model for MCP
const Model = new ApiModel('http://localhost:8080', 'products');
(Model as any)._schema = {
  paths: schemaObject,
  options: {
    description: 'ExternalData model from external API',
    mcpDescription: 'Data model fetched from external API. This model represents the structure of data returned by the external service.'
  }
};
```

**Important**: When generating an API model, the template includes a schema definition section. You should:
1. Inspect the actual API response structure
2. Update the `schemaObject` to match the real data structure
3. Add `description` and `mcpDescription` for each field
4. This ensures MCP has proper context about the data structure

### Example 4: Rich Schema Descriptions

Define a model with comprehensive MCP descriptions:

```typescript
const schemaObject: Record<string, any> = {
  title: {
    type: String,
    required: true,
    description: 'Product title',
    mcpDescription: 'The display name of the product. Should be clear, concise, and SEO-friendly. Used in product listings and search results.'
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    description: 'Product price',
    mcpDescription: 'The selling price of the product in USD. Must be a positive number. Used for pricing calculations and financial reporting.'
  },
  category: {
    type: String,
    enum: ['electronics', 'clothing', 'food', 'books'],
    description: 'Product category',
    mcpDescription: 'The category this product belongs to. Used for filtering, navigation, and inventory organization. Must be one of: electronics, clothing, food, books.'
  },
  tags: {
    type: [String],
    description: 'Search tags',
    mcpDescription: 'Array of searchable tags extracted from product data for full-text search. Used for searching and filtering products. Automatically indexed for fast search queries.'
  }
};
```

### Example 4: Starting MCP Server Programmatically (STDIO / standalone)

This example is for a **standalone process** using STDIO. The Express app instead uses `transports: ['http']` and attaches Streamable HTTP at `/mcp/http` without calling `start()`.

```typescript
import { createUnifiedMCPServer } from './mcp/servers/unified.js';
import { autoRegisterServices } from './mcp/auto-register.js';
import mcpRegistry from './mcp/registry.js';

async function startMCPServer() {
  await autoRegisterServices();

  const mcpServer = createUnifiedMCPServer({
    name: 'my-api-mcp',
    version: '1.0.0',
    transports: ['stdio'],
    stdio: { enabled: true }
  });

  // Set server in registry
  mcpRegistry.setServer(mcpServer.server);

  // Start server
  await mcpServer.start();
  console.log('MCP server started');
}

startMCPServer().catch(console.error);
```

## Troubleshooting

### MCP Server Not Starting

**Problem**: MCP endpoints (`/mcp/http`, `/mcp/info`) return 404 or "MCP not enabled"

**Solutions**:
1. Enable MCP: set **`ENABLE_MCP=true`** or run with **`NODE_ENV=development`** (e.g. `npm run dev`). The app uses `config.enableMcp` to decide whether to initialize MCP.
2. Verify database connections are established (MCP requires DB access).
3. Check application logs for initialization errors.
4. Ensure `@modelcontextprotocol/sdk` is installed: `npm install @modelcontextprotocol/sdk`.

### Services Not Auto-Registered

**Problem**: Generated services don't appear in MCP

**Solutions**:
1. Verify registration files exist in `src/mcp/services/`
2. Check that registration files export a default function
3. Ensure `autoRegisterServices()` is called during initialization
4. Check application logs for registration errors

### Controller Methods Not Exposed

**Problem**: Custom controller methods aren't exposed as MCP tools

**Solutions**:
1. Verify `@mcp.expose true` annotation is present
2. Check JSDoc comment format (must be `/** ... */`)
3. Ensure method is defined on the controller object
4. Restart the application after adding annotations

### Type Errors in Registration Files

**Problem**: TypeScript errors in generated registration files

**Solutions**:
1. Ensure `@modelcontextprotocol/sdk` types are installed
2. Check that `Server` type is imported correctly
3. Verify registration function signature matches `MCPServiceRegistration` type

### Database Connection Required

**Problem**: MCP operations fail with database errors

**Solutions**:
1. Ensure database connections are initialized before MCP servers start
2. Check database connection strings in environment variables
3. Verify MongoDB/MySQL services are running
4. Check database initialization logs

## Best Practices

1. **Always add MCP descriptions**: Provide both `description` and `mcpDescription` for better LLM understanding
2. **Use descriptive tool names**: Custom tool names should be clear and follow naming conventions
3. **Document parameters**: Add parameter descriptions in JSDoc comments
4. **Test MCP exposure**: Verify that exposed methods work correctly before deploying
5. **Monitor registration**: Check logs to ensure services are registered successfully
6. **Use annotations consistently**: Apply `@mcp.expose` annotations to all methods you want to expose

## Generating MCP Client Configuration

### Configuration Endpoint

The framework provides an endpoint to generate MCP client configuration files for easy installation in LLM clients:

**GET `/mcp/config`**

This endpoint generates JSON configuration files that can be used to connect LLM clients (Claude Desktop, ChatGPT, etc.) to your cloud-hosted MCP server.

#### Query Parameters

- `format` (optional): Configuration format
  - `'claude'` - Claude Desktop format
  - `'chatgpt'` - ChatGPT/OpenAI format
  - `'generic'` (default) - Generic MCP format with full details
- `transport` (optional): Transport type
  - `'http'` (default) - HTTP transport for cloud deployment
  - `'sse'` - Server-Sent Events transport
- `baseUrl` (optional): Override the base URL
  - Default: Automatically detected from request
  - Example: `https://api.example.com`
- `download` (optional): Download as file
  - `'true'` - Downloads as JSON file
  - `false` (default) - Returns JSON in response body

#### Examples

**Get generic configuration:**
```bash
GET /mcp/config
```

**Get Claude Desktop configuration:**
```bash
GET /mcp/config?format=claude&transport=http
```

**Download ChatGPT configuration:**
```bash
GET /mcp/config?format=chatgpt&transport=http&download=true
```

**Custom base URL:**
```bash
GET /mcp/config?format=generic&baseUrl=https://api.example.com
```

#### Configuration Output

The endpoint returns a JSON configuration file that includes:

- **Server information**: Name, version, description
- **Transport configuration**: HTTP/SSE endpoint URLs
- **Available tools**: List of all exposed controller methods
- **Available resources**: List of all model resources
- **Service registry**: Registered MCP services
- **Environment variables**: Required configuration
- **Setup instructions**: Step-by-step installation guide

#### Example Response (Generic Format)

```json
{
  "name": "express-api-framework-dev",
  "version": "1.0.0",
  "transport": {
    "type": "http",
    "url": "https://api.example.com/mcp/http"
  },
  "capabilities": {
    "tools": {
      "count": 24,
      "list": ["create_products", "create_many_products", "update_products", "delete_products", ...]
    },
    "resources": {
      "count": 9,
      "list": ["products://list", "products://{id}", "products://search", "orders://list", ...]
    }
  },
  "server": {
    "name": "Express REST API and MCP Server Framework MCP Server",
    "version": "1.0.0",
    "baseUrl": "https://api.example.com",
    "endpoint": "https://api.example.com/mcp/http"
  },
  "services": ["product", "order", "externaldata"],
  "tools": [...],
  "resources": [...],
  "env": {
    "MCP_SERVER_URL": "https://api.example.com/mcp/http",
    "MCP_TRANSPORT": "http",
    "BASE_URL": "https://api.example.com"
  },
  "instructions": {
    "setup": [
      "1. Copy this configuration file",
      "2. Add it to your LLM client's MCP configuration directory",
      "3. Ensure your client supports HTTP transport",
      "4. Restart your LLM client",
      "5. The MCP server will be available for use"
    ]
  }
}
```

### Server Information Endpoint

**GET `/mcp/info`**

Returns detailed information about the MCP server including:
- Server status and version
- Available tools (with descriptions)
- Available resources (by model)
- Registered services
- Supported transports

**Example:**
```bash
GET /mcp/info
```

**Response:**
```json
{
  "server": {
    "name": "Express REST API and MCP Server Framework MCP Server",
    "version": "1.0.0",
    "enabled": true
  },
  "services": {
    "count": 3,
    "list": ["product", "order", "externaldata"]
  },
  "tools": {
    "count": 24,
    "list": [...]
  },
  "resources": {
    "count": 9,
    "models": [...]
  },
  "transports": {
    "available": ["http", "sse"],
    "recommended": "http"
  }
}
```

### Connecting from Cursor

When adding this MCP server in Cursor (Settings → MCP → Add server), use **HTTP** transport:

1. **Start your API server** (with MCP enabled: `ENABLE_MCP=true` or run in development). The server exposes **GET/POST `/mcp/http`** for the MCP Streamable HTTP transport.

2. **Use this shape in Cursor’s MCP config** (e.g. in `~/.cursor/mcp.json` or the in-editor MCP settings):
   - **`type`** must be exactly **`"http"`** (not `"http > mcp-config.json"` or anything else).
   - **`url`** must be your server’s MCP HTTP endpoint, e.g. `http://localhost:8080/mcp/http`.

   **Correct example:**
   ```json
   "express-api-framework-dev": {
     "type": "http",
     "url": "http://localhost:8080/mcp/http",
     "env": {
       "MCP_SERVER_URL": "http://localhost:8080/mcp/http",
       "MCP_TRANSPORT": "http"
     }
   }
   ```

   **Common mistake:** Pasting output from a terminal (e.g. `curl ... > mcp-config.json`) into the `type` field, which can produce invalid values like `"http > mcp-config.json"`. Always set `type` to the literal string `"http"`.

3. If you see **404** or **No server info found**, ensure the API process is running and MCP is enabled; then open `http://localhost:8080/mcp/info` in a browser to confirm the server is up.

### Cloud Deployment Setup

For cloud deployment, follow these steps:

1. **Deploy your API** to your cloud provider (AWS, Azure, GCP, etc.)

2. **Get the configuration**:
   ```bash
   curl https://your-api.com/mcp/config?format=claude&transport=http > mcp-config.json
   ```

3. **Install in Claude Desktop**:
   - Open Claude Desktop settings
   - Navigate to MCP servers configuration
   - Add the configuration from `mcp-config.json`
   - Restart Claude Desktop

4. **Verify connection**:
   - Use `/mcp/info` endpoint to verify server is accessible
   - Check that tools and resources are listed correctly

### Security Considerations

- **Authentication**: The MCP endpoints are currently public. Consider adding authentication if needed
- **HTTPS**: Always use HTTPS in production for secure communication
- **Rate Limiting**: MCP endpoints are subject to the same rate limiting as other API endpoints
- **CORS**: Configure CORS appropriately if accessing from web clients

## Additional Resources

- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/typescript-sdk)
- [Project Architecture Documentation](./ARCHITECTURE.md)
- [Getting Started Guide](./GETTING_STARTED.md)
