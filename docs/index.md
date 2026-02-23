# Express REST API and MCP Server Framework

[![codecov](https://codecov.io/gh/iolufemi/Express-REST-API-Generator/branch/master/graph/badge.svg)](https://codecov.io/gh/iolufemi/Express-REST-API-Generator) [![Documentation Status](https://readthedocs.org/projects/express-rest-api-generato/badge/?version=latest)](https://express-rest-api-generato.readthedocs.io//en/latest/?badge=latest)

Express REST API and MCP Server Framework is a framework for building RESTful APIs with Express.js. It uses Node.js, Express, Mongoose (MongoDB), and Sequelize (SQL). Every generated service exposes both REST endpoints and an MCP server so LLMs can interact with your API. The resulting app is a JSON REST API over HTTP plus MCP tools and resources for AI clients.

**GitHub repository:** [iolufemi/Express-REST-API-and-MCP-Server-Framework](https://github.com/iolufemi/Express-REST-API-and-MCP-Server-Framework)

## What is API?

In computer programming, an application programming interface (API) is a set of clearly defined methods of communication between various software components. A good API makes it easier to develop a computer program by providing all the building blocks, which are then put together by the programmer. An API may be for a web-based system, operating system, database system, computer hardware or software library. Just as a graphical user interface makes it easier for people to use programs, application programming interfaces make it easier for developers to use certain technologies in building applications. - [Wikipedia](https://en.wikipedia.org/wiki/Application_programming_interface)

## What is REST?

Representational state transfer (REST) or RESTful web services is a way of providing interoperability between computer systems on the Internet. REST-compliant Web services allow requesting systems to access and manipulate textual representations of Web resources using a uniform and predefined set of stateless operations. - [Wikipedia](https://en.wikipedia.org/wiki/Representational_state_transfer)

> NOTE: The use of this project requires that you have a basic knowledge of using Express in building a REST API.

## What is MCP?

**MCP (Model Context Protocol)** is an open protocol that lets AI assistants (e.g. Claude, ChatGPT, Cursor) interact with your application through a standard interface. Instead of the LLM calling your REST API with raw HTTP, it uses MCP to discover and use **tools** (actions like create, update, delete) and **resources** (read-only data like list and get-by-id). - [Wikipedia](https://en.wikipedia.org/wiki/Model_Context_Protocol)

This framework includes a built-in MCP server. When you generate a service with `npm run generate -- --name users`, the same data is exposed as REST endpoints and as MCP tools and resources. See [MCP Guide](./MCP_GUIDE.md) for setup and details.

## Why use Express REST API and MCP Server Framework?

1. **Fast development** — Generate full CRUD + MCP with one command (`npm run generate -- --name <Name>`).
2. **Dual interface** — Every generated service exposes both REST API and MCP (tools + resources) for LLMs.
3. **LLM-ready** — Connect Cursor, Claude, or other MCP clients via HTTP; no extra glue code.
4. **TypeScript** — Full type safety and a clear structure for controllers and models.
5. **Endpoint versioning** — Route files like `users.v1.ts` map to `/v1/users`; latest at `/users`.
6. **Unit testing** — Auto-generated tests for routes, controllers, and models; run with `npm test`.
7. **Best practices** — Linting, consistent error handling, and uniform response formats.
8. **Security** — Optional encryption, rate limiting, x-tag for POST; secure by default.
9. **Data safety** — Deleted records go to trash and can be restored.
10. **Audit** — Request/response logging for debugging and compliance.
11. **Background jobs** — Bull queue, clock, and workers for scheduled and async tasks.
12. **Database choice** — MongoDB (Mongoose), SQL (Sequelize), or an external API as the data source.
13. **Organized layout** — Clear separation of routes, controllers, models, services, and MCP.

## Installation

### Prerequisites

- **Node.js** 22.x or higher (LTS recommended)
- **MongoDB** (for default database)
- **Redis** (for queue system and caching)
- **SQL database** (optional, for Sequelize models)

### Setup

Clone the repository and install dependencies:

```bash
$ git clone https://github.com/iolufemi/Express-REST-API-and-MCP-Server-Framework.git ./yourProjectName 
$ cd yourProjectName
$ npm install
```

### Key scripts

| Command | Description |
|---------|-------------|
| `npm run generate -- --name <Name>` | Generate a **MongoDB** CRUD endpoint (use `-n` for short). |
| `npm run generate -- --name <Name> --sql` | Generate a **SQL** CRUD endpoint. |
| `npm run generate -- --name <Name> --baseurl <URL> --endpoint <path>` | Generate an **API-as-DB** endpoint. Short: `-n`, `-b`, `-e`. |
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run production server |
| `npm test` | Run unit tests |
| `npm run type-check` | TypeScript type-check only |
| `npm run release -- --release-type patch` | Bump version, changelog, tag, GitHub release (use `minor` or `major` for `--release-type` as needed) |

Then generate your first API endpoint using the **`generate`** script (no global gulp install needed):

```bash
$ npm run generate -- --name yourFirstEndpoint
```

This creates a full CRUD endpoint for `yourFirstEndpoint`. You can use `-n` instead of `--name`.

With the `generate` command, you have the option of using either Mongo DB, an SQL compatible DB or using an API generated by this framework as a database model. To use an API as a database pass `--baseurl` and `--endpoint`; for an SQL compatible db, pass `--sql`. See examples below.

Generated services also expose **`GET /{service}/schema`** for schema metadata (fields, types, descriptions), used by MCP and API consumers. For API-based models, the schema can be auto-discovered from the external API's `/schema` endpoint, with fallback to the model file's schema definition.

### Using an API as a DB

```bash
$ npm run generate -- --name yourEndpointWithAPIAsDB --baseurl http://localhost:8080 --endpoint users
```

See [API as DB specification](./API_AS_DB_SPEC.md) for the contract your API must implement and how to test for compliance.

### Using an SQL compatible database

```bash
$ npm run generate -- --name yourEndpointWITHSQL --sql
```

GET requests for SQL endpoints support **`?populate=<field>`** to include related records (e.g. `?populate=toPop`). The template includes one example reference field (`toPop`). To add more reference fields and make them work with populate, see **[SQL Populate](./SQL_POPULATE.md)**.

> Note: You can use `-n` instead of `--name`, `-b` instead of `--baseurl`, `-e` instead of `--endpoint`. The `generate` script runs `npx gulp --gulpfile gulpfile.cjs service` so the correct gulpfile is always used.

Try out your new endpoint.

Start the app

```bash
$ npm start
```
by default, the app will start on `PORT 8080`

You can change the PORT by adding a `PORT` environment variable. 
eg.

```bash
$ PORT=6000 npm start
```
now the app will start on `PORT 6000`

To start the app for development, run

```bash
$ npm run dev
```
This will automatically restart your app whenever a change is detected (uses `tsx watch`).

### REST API endpoints

- `[POST] http://localhost:8080/yourFirstEndpoint` — Create resources (single or bulk)
- `[GET] http://localhost:8080/yourFirstEndpoint` — List/search (filters, pagination, sorting, projection, date range)
- `[GET] http://localhost:8080/yourFirstEndpoint/:id` — Get one resource
- `[PUT] http://localhost:8080/yourFirstEndpoint` — Update multiple (with query)
- `[PATCH] http://localhost:8080/yourFirstEndpoint/:id` — Update one
- `[DELETE] http://localhost:8080/yourFirstEndpoint?key=value` — Delete multiple (with query)
- `[DELETE] http://localhost:8080/yourFirstEndpoint/:id` — Delete one
- `[POST] http://localhost:8080/yourFirstEndpoint/:id/restore` — Restore a deleted resource
- `[GET] http://localhost:8080/yourFirstEndpoint/schema` — Schema metadata (for MCP and API consumers)

### Health and MCP endpoints

- `[GET] http://localhost:8080/health` — Full health (databases, queues, uptime)
- `[GET] http://localhost:8080/health/ready` — Readiness probe
- `[GET] http://localhost:8080/health/live` — Liveness probe
- `[GET] http://localhost:8080/mcp/config` — Generate MCP client config (e.g. `?format=claude&transport=http&download=true`)
- `[GET] http://localhost:8080/mcp/info` — MCP server info (tools, resources, services)

### x-tag requirement for POST requests

Every **POST** request must include an **`x-tag`** header (or query parameter `x-tag`). Without it, the API responds with **400 Bad Request** and a message directing you to obtain a tag.

- **Get an x-tag:** `[GET] /initialize` — returns a new tag value, e.g. `{ "data": { "x-tag": "…" } }`.
- **Send it on POST:** Include it in the request header: `x-tag: <value>` (or as query param `?x-tag=<value>`).

The tag is used for secure communication and for AES encryption when secure mode is enabled. If you send a POST without `x-tag`, the response body will look like:

```json
{
  "status": "error",
  "message": "POST requests require an x-tag header. Get a value from GET /initialize and send it as the x-tag header (or query param x-tag)."
}
```   

## Some asynchronous goodness

Start the clock (You should only have a single instance of this at all times.)

```bash
$ npm run clock
```
The clock is similar to a crontab. It dispatches tasks to available workers at a predefined interval.

To define a clock, look for the `clock` collection in the MongoDB you connected to the `LOG_MONGOLAB_URL` environment variable, and create a record similar to the below

```json
{ 
    "crontab" : "* * * * *", 
    "name" : "Task Name", 
    "job" : "theJobAsDefinedInTheWorkerFile", 
    "enabled" : true,
    "arguments" : {}
}
```

> NOTE: Whenever you change the value of a clock on the DB, you need to restart the clock. (Still looking for the best way to make this automatic)

Start the workers 

```bash
$ npm run workers
```
A worker runs tasks or processes in the background. It is useful for running long running processes and background tasks.

See `/services/queue/jobs` for sample tasks and `/services/queue/workers` for how to setup worker processes.

## Versioning your API endpoints

You can create multiple versions of your API endpoints by simply adding the version number to your route file name. eg. `users.v1.ts` will put a version of the users resources on the `/v1/users` endpoint. users.v2.ts will put a version of the users resources on the `/v2/users` endpoint. The latest version of the resources will always be available at the `/users` endpoint.

> NOTE: This project will automatically load route files found in the `src/routes/` folder.

## Model Context Protocol (MCP) Integration

This project includes a built-in MCP server so LLMs can use your API via tools and resources (see [What is MCP?](#what-is-mcp) above).

### Generated MCP tools and resources

Every generated service is exposed as MCP tools and resources (model name is lowercased; e.g. `Items` → `items`):

**MCP Tools** (actions LLMs can call):
- `create_<model>` — Create one record (e.g. `create_items`)
- `create_many_<model>` — Bulk create (e.g. `create_many_items`; pass `{ "items": [ {...}, {...} ] }`)
- `update_<model>` — Update a record by id and data
- `delete_<model>` — Delete a record by id

**MCP Resources** (read-only; LLMs read via resource URIs):
- `<model>://list` — List records (optional `?limit=N&skip=M` for pagination; response includes `pagination.nextPageUri`)
- `<model>://{id}` — Get one record by id
- `<model>://search` — Search (e.g. `?q=...` or `?query=...`)

Example for a generated `Items` service: tools `create_items`, `create_many_items`, `update_items`, `delete_items`; resources `items://list`, `items://search`, `items://{id}`.

### MCP features

- **Automatic model exposure**: All generated models are exposed as MCP resources and tools
- **Controller method exposure**: Additional controller methods can be exposed as MCP tools via JSDoc annotations
- **Schema metadata**: Model schemas include descriptions for LLM context
- **Resource access**: Models are readable via MCP resource URIs
- **Tool execution**: Create, update, delete (and bulk create) are callable as MCP tools

### Exposing Controller Methods to MCP

To expose a controller method as an MCP tool, add JSDoc annotations:

```typescript
/**
 * Custom method with MCP exposure
 * @mcp.expose true
 * @mcp.toolName sendWelcomeEmail
 * @mcp.description Send a welcome email to a user after registration
 */
sendWelcomeEmail: async function (req: ExpressRequest, res: ExpressResponse, next: ExpressNext): Promise<void> {
  // Your implementation
}
```

All standard CRUD methods (find, findOne, create, update, updateOne, delete, deleteOne, restore) are automatically exposed as MCP tools.

### MCP Service Registration

When you generate a new service using `npm run generate -- --name YourService`, an MCP service registration file is automatically created in `src/mcp/services/`. This file registers all MCP components for your service.

### MCP Client Configuration

The framework provides endpoints to generate MCP client configuration files for easy installation in LLM clients:

**GET `/mcp/config`** - Generate MCP client configuration JSON
- Query parameters:
  - `format`: `'claude'` | `'chatgpt'` | `'generic'` (default: `'generic'`)
  - `transport`: `'http'` | `'sse'` (default: `'http'`)
  - `baseUrl`: Override base URL
  - `download`: `'true'` to download as file
- Example: `GET /mcp/config?format=claude&transport=http&download=true`

**GET `/mcp/info`** - Get MCP server information
- Returns available tools, resources, and services
- Shows server capabilities and status

For more information about MCP integration, see the [MCP Guide](./MCP_GUIDE.md).

## Documentation

Navigate to other guides from here:

- **[Getting Started](./GETTING_STARTED.md)** — Prerequisites, installation, configuration, generating services, testing
- **[Architecture](./ARCHITECTURE.md)** — System design, MCP layer, auto-registration
- **[MCP Guide](./MCP_GUIDE.md)** — MCP integration, tools, resources, schema, Cursor setup, client configuration
- **[Queue Guide](./QUEUE_GUIDE.md)** — Background jobs, clock, workers
- **[SQL Populate](./SQL_POPULATE.md)** — How to add and use reference fields with `?populate=` on SQL endpoints
- **[Migration](./MIGRATION.md)** — Migration notes and changes
- **[Security Updates](./SECURITY_UPDATES.md)** — Security-related dependency and configuration notes

From the project root, the main [README](../README.md) lists these and release instructions (`npm run release -- --release-type patch`).

## File Structure

- `src/config` - Configuration files
- `src/controllers` - Request handlers (TypeScript)
- `src/models` - Database models (TypeScript, Mongoose/Sequelize)
- `src/routes` - Route definitions (TypeScript)
- `src/services` - Service layer (queue, logger, validator, etc.)
- `src/mcp` - Model Context Protocol integration
- `template` - Code generation templates
- `test` - Unit tests

## TypeScript Support

This project is built with TypeScript and all generated code uses TypeScript with ES modules. The templates generate:

- TypeScript controllers with proper type annotations
- TypeScript models with Mongoose/Sequelize types
- TypeScript routes with Express types
- Full type safety throughout the codebase

## Getting support, Reporting Bugs and Issues

If you need support or want to report a bug, please log an issue [here](https://github.com/iolufemi/Express-REST-API-and-MCP-Server-Framework/issues)

## Running Unit Tests

All generated endpoints come with complete test suites; we encourage you to update the tests as you extend the logic.

**Quick run:** `npm test` (or `npm run test:coverage` for coverage). Ensure MongoDB and Redis are running and `.env` (and optionally `.env.test`) are configured.

**Full setup (so the whole suite passes):** Generate the four endpoints (SQL + API-using-SQL, Mongo + API-using-Mongo), then start the server (e.g. `npm start` on port 8080) and run `npm test`. API-based route tests call the running server at `http://localhost:8080` (override with `TEST_API_BASEURL`). See **[Getting Started → Testing](./GETTING_STARTED.md#testing)** for step-by-step setup, generate commands, and prerequisites.

## How to contribute

View how to contribute [here](https://github.com/iolufemi/Express-REST-API-and-MCP-Server-Framework/blob/master/CONTRIBUTING.md)

## Code of Conduct

View the code of conduct [here](https://github.com/iolufemi/Express-REST-API-and-MCP-Server-Framework/blob/master/CODE_OF_CONDUCT.md)

## Contributors

- [Olufemi Olanipekun](https://github.com/iolufemi)

## FAQs

- **How do I get an x-tag for POST?** Call `GET /initialize`; the response includes `data['x-tag']`. Send it as the `x-tag` header (or `?x-tag=...`) on every POST.
- **How do I connect Cursor to the MCP server?** Start the API with MCP enabled (`npm run dev` or `ENABLE_MCP=true`), then in Cursor MCP settings add an HTTP server with URL `http://localhost:8080/mcp/http`. See [MCP Guide](./MCP_GUIDE.md#connecting-from-cursor).
- **Where are routes loaded from?** Route files in `src/routes/` are loaded automatically. Use `users.v1.ts` for `/v1/users`; the latest version is also at `/users`.
