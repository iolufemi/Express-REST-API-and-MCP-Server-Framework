# Express REST API Generator

[![Build Status](https://travis-ci.org/iolufemi/Express-REST-API-Generator.svg?branch=dev)](https://travis-ci.org/iolufemi/Express-REST-API-Generator)  [![codecov](https://codecov.io/gh/iolufemi/Express-REST-API-Generator/branch/master/graph/badge.svg)](https://codecov.io/gh/iolufemi/Express-REST-API-Generator) [![Documentation Status](https://readthedocs.org/projects/api-template/badge/?version=latest)](http://api-template.readthedocs.io/en/latest/?badge=latest)

Express REST API Generator is a comprehensive development framework for building RESTful APIs with Express.js. This project provides a complete template for creating production-ready APIs using Node.js, Express, Mongoose (MongoDB), and Sequelize (SQL databases). 

**🚀 Coming Soon**: This project is being modernized to include:
- **TypeScript** support with full type safety
- **MCP (Model Context Protocol) servers** - enabling LLMs (Claude, ChatGPT) to interact with your API
- **Bull queue system** for robust job processing
- **90%+ test coverage** with comprehensive test suites
- **Modern dependencies** and best practices

The resulting API provides both:
- **REST API endpoints** - Traditional HTTP/JSON API for web and mobile clients
- **MCP servers** - Direct integration with LLMs for AI-powered interactions

## What is API?

In computer programming, an application programming interface (API) is a set of clearly defined methods of communication between various software components. A good API makes it easier to develop a computer program by providing all the building blocks, which are then put together by the programmer. An API may be for a web-based system, operating system, database system, computer hardware or software library. Just as a graphical user interface makes it easier for people to use programs, application programming interfaces make it easier for developers to use certain technologies in building applications. - [Wikipedia](https://en.wikipedia.org/wiki/Application_programming_interface)

## What is REST?

Representational state transfer (REST) or RESTful web services is a way of providing interoperability between computer systems on the Internet. REST-compliant Web services allow requesting systems to access and manipulate textual representations of Web resources using a uniform and predefined set of stateless operations. - [Wikipedia](https://en.wikipedia.org/wiki/Representational_state_transfer)

> NOTE: The use of this project requires that you have a basic knowledge of using express in building a REST API. If you are a newbie, here are some awesome tutorials to get you started.

- [Build Node.js RESTful APIs in 10 Minutes](https://www.codementor.io/olatundegaruba/nodejs-restful-apis-in-10-minutes-q0sgsfhbd)
- [Easily Develop Node.js and MongoDB Apps with Mongoose](https://scotch.io/tutorials/using-mongoosejs-in-node-js-and-mongodb-applications)
- [Build a RESTful API Using Node and Express 4](https://scotch.io/tutorials/build-a-restful-api-using-node-and-express-4)

## Why use Express REST API Generator?

1. **Fast Development**: Generate complete CRUD endpoints with a single command
2. **Dual Interface**: Every generated service provides both REST API and MCP server interfaces
3. **LLM Integration**: Built-in MCP servers allow LLMs (Claude, ChatGPT) to interact with your data and perform actions
4. **Type Safety**: TypeScript support ensures type-safe code and better developer experience
5. **Endpoint Versioning**: Built-in support for API versioning
6. **Comprehensive Testing**: Auto-generated test suites with 90%+ coverage target
7. **Best Practices**: Enforces code quality with linting, proper error handling, and uniform response formats
8. **Secure by Default**: Built-in encryption, rate limiting, and security headers
9. **Data Safety**: Automatic backup of deleted data to trash
10. **Audit Trail**: Complete logging of API requests and responses
11. **Job Queue**: Distributed job queue system (Bull) for background processing
12. **Database Flexibility**: Support for MongoDB (Mongoose) and SQL databases (Sequelize)
13. **Clean Architecture**: Well-organized file structure that scales with your team

## Installation

### Prerequisites

- **Node.js** 22.x or higher (LTS recommended)
- **MongoDB** (for default database)
- **Redis** (for queue system and caching)

### Setup

Clone the repository and install dependencies:

```bash
$ git clone https://github.com/iolufemi/Express-REST-API-Generator.git ./yourProjectName 
$ cd yourProjectName
$ npm install
```

### Key scripts

| Command | Description |
|---------|-------------|
| `npm run generate -- --name &lt;Name&gt;` | Generate a new CRUD endpoint (route, controller, model, MCP registration, tests). Use `-n` for short. Add `--sql` for SQL models; `--baseurl` and `--endpoint` for API-as-DB. |
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run production server |
| `npm test` | Run unit tests (Mocha, spec reporter) |
| `npm run type-check` | Run TypeScript type-check only |

The **`generate`** script runs `npx gulp --gulpfile gulpfile.cjs service` so the correct gulpfile is always used (avoids "No gulpfile found" when running `gulp` directly).

### Generate Your First Service

Generate a complete CRUD service with both REST API and MCP server support using the **`generate`** script (runs the gulp service task with the correct config via `npx`):

```bash
$ npm run generate -- --name yourFirstEndpoint
```

Or using the short form:

```bash
$ npm run generate -- -n yourFirstEndpoint
```

This single command generates:
- ✅ REST API endpoints (routes, controllers, models)
- ✅ MCP server tools and resources (for LLM integration)
- ✅ Complete test suites
- ✅ TypeScript type definitions (when TypeScript migration is complete)

> **Why `npm run generate`?** The project uses `gulpfile.cjs`. Running `gulp service` directly can fail with "No gulpfile found". The `generate` script runs `npx gulp --gulpfile gulpfile.cjs service`, so you don't need to install gulp globally or remember the gulpfile path.

With the `generate` command, you have the option of using either Mongo DB, an SQL compatible DB or using an API generated by this Express Generator as a database model. To use an API as a database you can pass the `baseurl` and the `endpoint` option; for an SQL compatible db, pass the `sql` option. See examples below.

### Using an API as a DB

```bash
$ npm run generate -- --name yourEndpointWithAPIAsDB --baseurl http://localhost:8080 --endpoint users
```

**Important for MCP**: After generating an API-based model, you need to:
1. Inspect the actual API response structure
2. Update the `schemaObject` in the generated model file to match the real data structure
3. Add `description` and `mcpDescription` fields for each schema field
4. This ensures the MCP server has proper context about the data structure

The generated template includes a schema definition section with examples - replace them with your actual API response fields. The **schema endpoint** (`GET /{service}/schema`) can optionally discover schema from the external API at `GET {baseurl}/{endpoint}/schema`; if that fails or is not available, it falls back to the `_schema` defined in the model file.

### Using an SQL compatible database

```bash
$ npm run generate -- --name yourEndpointWITHSQL --sql
```

> **Note:** You can use `-n` instead of `--name`, `-b` instead of `--baseurl`, `-e` instead of `--endpoint`.

Try out your new endpoint.

Start the app

```
$ npm start
```
by default, the app will start on `POST 8080`

You can change the PORT by adding a `PORT` environment variable. 
eg.

```
$ PORT=6000 npm start
```
now the app will start on `PORT 6000`

To start the app for development, run

```bash
$ npm run dev
```

This will automatically restart your app whenever a change is detected using `tsx watch`.

## Generated Service Features

When you generate a service, you get access to:

### REST API Endpoints

- `[POST] http://localhost:8080/yourFirstEndpoint` - Create resources (single or bulk)
- `[GET] http://localhost:8080/yourFirstEndpoint` - List/search resources (supports filters, pagination, sorting, projection, date range)
- `[GET] http://localhost:8080/yourFirstEndpoint/:id` - Get a specific resource
- `[PUT] http://localhost:8080/yourFirstEndpoint` - Update multiple resources (with query)
- `[PATCH] http://localhost:8080/yourFirstEndpoint/:id` - Update a single resource
- `[DELETE] http://localhost:8080/yourFirstEndpoint?key=value` - Delete multiple resources (with query)
- `[DELETE] http://localhost:8080/yourFirstEndpoint/:id` - Delete a single resource
- `[POST] http://localhost:8080/yourFirstEndpoint/:id/restore` - Restore a previously deleted resource
- `[GET] http://localhost:8080/yourFirstEndpoint/schema` - Get schema metadata (fields, types, descriptions) for MCP and API consumers

### Health Check Endpoints

- `[GET] http://localhost:8080/health` - Full health status (databases, queues, uptime)
- `[GET] http://localhost:8080/health/ready` - Readiness probe (for Kubernetes/Docker)
- `[GET] http://localhost:8080/health/live` - Liveness probe (for Kubernetes/Docker)

### MCP Configuration Endpoints

- `[GET] http://localhost:8080/mcp/config` - Generate MCP client configuration JSON
  - Query params: `format` (claude|chatgpt|generic), `transport` (http|sse), `baseUrl`, `download`
  - Example: `GET /mcp/config?format=claude&transport=http&download=true`
- `[GET] http://localhost:8080/mcp/info` - Get MCP server information (tools, resources, services)

### MCP Server Integration

Every generated service automatically exposes MCP tools and resources for LLM integration:

**MCP Tools** (Actions LLMs can perform):
- `createYourFirstEndpoint` - Create new resources
- `getYourFirstEndpoint` - Get a resource by ID
- `updateYourFirstEndpoint` - Update a resource
- `updateYourFirstEndpoints` - Bulk update resources
- `deleteYourFirstEndpoint` - Delete a resource
- `deleteYourFirstEndpoints` - Bulk delete resources
- `restoreYourFirstEndpoint` - Restore a deleted resource
- `searchYourFirstEndpoints` - Search with filters
- `listYourFirstEndpoints` - List with pagination

**MCP Resources** (Data LLMs can read):
- `yourFirstEndpoints://list` - List all resources
- `yourFirstEndpoints://{id}` - Get specific resource
- `yourFirstEndpoints://search` - Search resources

> **Note**: For every `POST` API call, you need to send an `x-tag` value in the header. This value is used for secure communication between the server and client. It is used for AES encryption when secure mode is enabled. To get a valid `x-tag`, call the `[GET] /initialize` endpoint.   

## Background Job Processing

### Queue System

The framework includes a distributed job queue system for background processing.

**Current**: Uses Bull queue system (Redis-based) for robust job processing

### Start the Clock

The clock dispatches scheduled tasks to workers (similar to a crontab). Only run one instance at a time.

```bash
$ npm run clock
```

To define a scheduled job, create a record in the `Clock` collection in MongoDB (connected via `LOG_MONGOLAB_URL`):

```json
{ 
    "crontab" : "* * * * *", 
    "name" : "Task Name", 
    "job" : "theJobAsDefinedInTheWorkerFile", 
    "enabled" : true,
    "arguments" : {}
}
```

> **Note**: After changing clock configuration in the database, restart the clock process.

### Start the Workers

Workers process background jobs from the queue:

```bash
$ npm run workers
```

Workers are useful for:
- Long-running processes
- Background tasks
- Async operations
- Scheduled jobs

See `/services/queue/jobs` for sample tasks and `/services/queue/workers` for worker configuration.

## Versioning your API endpoints

You can create multiple versions of your API endpoints by simply adding the version number to your route file name. eg. `users.v1.ts` will put a version of the users resources on the `/v1/users` endpoint. `users.v2.ts` will put a version of the users resources on the `/v2/users` endpoint. The latest version of the resources will always be available at the `/users` endpoint.

> NOTE: This project will automatically load route files found in the `src/routes/` folder.

## Project Structure

```
Express-REST-API-Generator/
├── config/              # Configuration files (development, production)
├── controllers/         # Request handlers (business logic)
├── models/              # Data models (Mongoose/Sequelize)
├── routes/              # Express routes
├── services/            # Service layer (queue, logger, encryption, etc.)
│   ├── queue/          # Job queue system (Bull)
│   ├── logger/         # Logging service
│   ├── encryption/     # Encryption utilities
│   └── ...
├── mcp/                 # MCP server implementations
│   ├── servers/        # MCP servers for models, controllers, services
│   └── services/       # Auto-generated MCP service registrations
├── templates/           # Code generation templates
├── test/                # Test suites
└── docs/                # Documentation
```

## MCP (Model Context Protocol) Integration

This framework provides built-in MCP server support, enabling LLMs to interact with your API directly.

### What is MCP?

MCP (Model Context Protocol) is a protocol that allows LLMs like Claude and ChatGPT to interact with external systems through:
- **Tools**: Callable functions (create, update, delete operations)
- **Resources**: Read-only data access (browse, view records)
- **Prompts**: Reusable interaction templates

### How It Works

When you generate a service with `npm run generate -- --name users`, the framework automatically:

1. Creates REST API endpoints (existing functionality)
2. Generates MCP server code that exposes:
   - All controller methods as MCP tools
   - Model data as MCP resources
3. Registers the service with the unified MCP server
4. Makes it immediately available to LLM clients

### Connecting LLMs

Once your service is running, you can connect LLM clients via:
- **STDIO transport**: For local development
- **HTTP/SSE transport**: For remote access (cloud deployment)

### Generating MCP Client Configuration

The framework provides endpoints to generate MCP client configuration files:

**GET `/mcp/config`** - Generate configuration JSON for LLM clients
- Supports formats: `claude`, `chatgpt`, `generic`
- Supports HTTP/SSE transport for cloud deployment
- Optional file download
- Example: `GET /mcp/config?format=claude&transport=http&download=true`

**GET `/mcp/info`** - Get MCP server information
- Lists available tools and resources
- Shows registered services
- Displays server capabilities

See [MCP Guide](./docs/MCP_GUIDE.md) for complete documentation on using and configuring MCP servers.

## Getting support, Reporting Bugs and Issues

If you need support or want to report a bug, please log an issue [here](https://github.com/iolufemi/Express-REST-API-Generator/issues)

## Testing

All generated services come with comprehensive test suites covering:
- Route handlers
- Controller methods
- Model operations
- MCP tools and resources (coming soon)

### Run Tests

```bash
$ npm test
```

### Test Coverage

The project maintains **90%+ test coverage** with:
- Unit tests for all components
- Integration tests for API endpoints
- MCP server tests (coming soon)
- Queue system tests

Coverage reports are generated automatically and can be viewed in the `coverage/` directory.

## How to contribute

View how to contribute [here](https://github.com/iolufemi/Express-REST-API-Generator/blob/master/CONTRIBUTING.md)

## Code of Conduct

View the code of conduct [here](https://github.com/iolufemi/Express-REST-API-Generator/blob/master/CODE_OF_CONDUCT.md)

## Contributors

- [Olufemi Olanipekun](https://github.com/iolufemi)

## Modernization Status

This project has been fully modernized with:

- ✅ **TypeScript Migration**: Full TypeScript support with strict type checking
- ✅ **MCP Server Integration**: Built-in MCP servers for LLM interaction
- ✅ **Bull Queue System**: Modern job queue replacing Kue
- ✅ **Modern Dependencies**: All packages updated to latest stable versions
- ✅ **Enhanced Testing**: 90%+ test coverage with comprehensive test suites
- ✅ **Better Documentation**: Complete guides and API references
- ✅ **Health Check Endpoints**: `/health`, `/health/ready`, `/health/live` for monitoring
- ✅ **Graceful Shutdown**: Proper resource cleanup on SIGTERM/SIGINT
- ✅ **Connection Retry Logic**: Exponential backoff for database connections
- ✅ **ES Module Route Loading**: Modern dynamic imports for route loading
- ✅ **Correct Execution Order**: All dependencies initialized in proper sequence

## Architecture & Execution Order

The application follows a strict initialization sequence to ensure reliability:

1. **Configuration** loaded
2. **Database connections** initialized and awaited (with retry logic)
3. **Express app** created and configured
4. **Routes** loaded dynamically (ES modules)
5. **Server** starts listening
6. **MCP servers** initialized (after databases ready)

See [EXECUTION_ORDER.md](./EXECUTION_ORDER.md) for complete details.

## Documentation

- **[Execution Order](./EXECUTION_ORDER.md)** - Complete application startup sequence and initialization order
- **[Implementation Review](./IMPLEMENTATION_REVIEW.md)** - Comprehensive review of implementation correctness
- **[Fixes Applied](./FIXES_APPLIED.md)** - Critical fixes and improvements
- **[Implementations Complete](./IMPLEMENTATIONS_COMPLETE.md)** - All remaining recommendations implemented
- **[MCP Concepts](./MCP_CONCEPTS.md)** - Understanding MCP resources, tools, and service registration
- **[Getting Started Guide](./docs/GETTING_STARTED.md)** - Quick start tutorial
- **[Architecture](./docs/ARCHITECTURE.md)** - System architecture and design
- **[Queue Guide](./docs/QUEUE_GUIDE.md)** - Background job processing with Bull
- **[MCP Guide](./docs/MCP_GUIDE.md)** - Complete MCP integration guide

## FAQs

### What is MCP and why should I use it?

MCP (Model Context Protocol) allows LLMs to interact with your API directly. Instead of making HTTP requests, LLMs can call tools and access resources through the MCP protocol. This enables AI-powered features like:
- Natural language data queries
- Automated data operations
- Intelligent API interactions
- AI assistants that understand your data model

### Do I need to write MCP code manually?

No! When you generate a service with `npm run generate -- --name users`, the framework automatically generates all MCP server code. Your service is immediately available to LLMs without any additional configuration.

### What's the difference between REST API and MCP?

- **REST API**: Traditional HTTP/JSON interface for web and mobile apps
- **MCP**: Protocol for LLM integration, enabling AI assistants to interact with your data

Both are generated automatically and work together seamlessly.

### When will TypeScript migration be complete?

The TypeScript migration is complete! All source files have been migrated to TypeScript. Test files are being migrated next.
