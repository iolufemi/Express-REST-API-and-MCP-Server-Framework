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
# See docs/SQL_POPULATE.md to add reference fields and use ?populate= on GET requests.

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

### Prerequisites for tests

- **Node.js** 22.x or higher
- **MongoDB** — required for Mongoose models and for any generated Mongo-based endpoints
- **Redis** — used by the test setup (cache/queue); tests clear Redis DBs before running
- **SQL database** — required only if you have (or generate) SQL-based endpoints

Ensure `.env` and optionally `.env.test` are configured (e.g. `LOG_MONGOLAB_URL`, `REDIS_URL`, `REDIS_QUEUE_URL`, and SQL vars if you use SQL). The test runner loads `.env` then `.env.test` (test overrides).

### Running the full unit tests

**1. Install and configure**

```bash
npm install
# Copy .env.example to .env (and .env.test if needed) and set MongoDB, Redis, and optional SQL URLs.
```

**2. (Optional) Generate endpoints so the full suite runs**

If you want the same test coverage as the template (Mongo, SQL, and API-based endpoints that call them), generate:

- A **SQL-based** endpoint, then an **API-based** endpoint that uses it as the backend:
  ```bash
  npm run generate -- --name order --sql
  npm run generate -- --name externalorder --baseurl http://localhost:8080 --endpoint orders
  ```
- A **Mongo-based** endpoint, then an **API-based** endpoint that uses it as the backend:
  ```bash
  npm run generate -- --name item
  npm run generate -- --name externalitem --baseurl http://localhost:8080 --endpoint items
  ```

**3. Start the server for API route tests (optional but recommended)**

Tests for **API-based** routes (e.g. `/externalorders`, `/externalitems`) call the real HTTP server so that the “external” API is available. Start the app on the default port (8080) in a separate terminal:

```bash
npm run build
npm start
```

Leave it running, then in another terminal run the tests. If your server uses a different URL, set `TEST_API_BASEURL` (e.g. `TEST_API_BASEURL=http://localhost:3000 npm test`).

**4. Run the tests**

```bash
# Run all tests (Mocha; uses test/run.mjs, which loads .env and .env.test)
npm test

# Run with coverage
npm run test:coverage

# Watch mode (re-run on file changes)
npm run test:watch
```

Controller and model tests do not require the server. Route tests for **API-based** endpoints do: they use `TEST_API_BASEURL` (default `http://localhost:8080`) to send requests to the running app.

## POST requests and x-tag

All **POST** requests must include an **`x-tag`** header (or query param `x-tag`). Otherwise the API returns **400** with a clear error message.

1. Get a tag: `GET /initialize` → response includes `data['x-tag']`.
2. Send it on every POST: `x-tag: <value>` in the request header.

See the main [docs index](./index.md#x-tag-requirement-for-post-requests) for the exact error response and details.

## MCP Integration

MCP is enabled when **`ENABLE_MCP=true`** or when **`NODE_ENV=development`** (see `config.enableMcp`). No separate "start MCP server" step is needed: the API server exposes the MCP HTTP transport at **`/mcp/http`** when MCP is enabled.

1. Start the API server with MCP enabled (`npm run dev` or `ENABLE_MCP=true npm start`).
2. Generate client configuration: `GET /mcp/config?format=claude&transport=http`
3. In Cursor (or another MCP client), add an HTTP server with `url: http://localhost:8080/mcp/http`.
4. See [MCP Guide](./MCP_GUIDE.md) and [docs index](./index.md#model-context-protocol-mcp-integration) for tools and resources.

The framework automatically exposes:
- **MCP tools** (per model): `create_<model>`, `create_many_<model>`, `update_<model>`, `delete_<model>` (model name lowercased, e.g. `create_items`).
- **MCP resources**: `<model>://list`, `<model>://{id}`, `<model>://search` (with optional `?limit=&skip=` on list; response includes `pagination.nextPageUri`).
- Schema field descriptions for LLM context and **`GET /{service}/schema`** for metadata.

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
