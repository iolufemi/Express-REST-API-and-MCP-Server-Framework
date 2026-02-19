# Getting Started

## Prerequisites

- Node.js 22.x or higher
- MongoDB (for Mongoose models)
- Redis (for caching and queue)
- SQL database (optional, for Sequelize models)

## Installation

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:
- Database connections (MongoDB, Redis, SQL)
- API keys and secrets
- Environment settings

## Development

```bash
# Start development server with hot reload
npm run dev

# Start queue workers
npm run workers

# Start queue clock (scheduled jobs)
npm run clock
```

## Building

```bash
# Build TypeScript to JavaScript
npm run build

# Start production server
npm start
```

## Generating Services

Use the **`generate`** script to create a new service (model, controller, routes, and MCP integration). It runs the gulp service task with the correct gulpfile via `npx`, so you don't need to install gulp globally or pass `--gulpfile gulpfile.cjs` manually.

```bash
# Generate a new service (MongoDB/Mongoose by default)
npm run generate -- --name Users

# Short form: -n instead of --name
npm run generate -- -n Product

# For SQL-based models
npm run generate -- --name Products --sql

# For API-based models (external API as data source)
npm run generate -- --name ExternalData --baseurl https://api.example.com --endpoint data
```

Optional flags: `-n` / `--name` (required), `-b` / `--baseurl`, `-e` / `--endpoint`, `--sql`.

This generates TypeScript files in `src/`:
- `src/models/Users.ts` - Model with schema descriptions
- `src/controllers/Users.ts` - Controller with MCP annotations
- `src/routes/users.ts` - Routes with versioning
- `src/mcp/services/users.registration.ts` - MCP integration file
- Test files in `test/` directory

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## MCP Integration

To enable MCP servers:

1. Set `ENABLE_MCP=true` in your environment
2. Set `START_MCP_SERVER=true` to start the MCP server
3. Generate client configuration: `GET /mcp/config?format=claude&transport=http`
4. Install the configuration in your LLM client
5. Connect your LLM client to the MCP server

The framework automatically exposes:
- All model data as MCP resources
- All controller methods as MCP tools
- Schema field descriptions for LLM context

### MCP Configuration Endpoints

**Generate Client Configuration:**
```bash
# Get configuration for Claude Desktop
curl http://localhost:8080/mcp/config?format=claude&transport=http > mcp-config.json

# Get configuration for ChatGPT
curl http://localhost:8080/mcp/config?format=chatgpt&transport=http > mcp-config.json

# Get server information
curl http://localhost:8080/mcp/info
```

See [MCP Guide](./MCP_GUIDE.md) for complete documentation.
