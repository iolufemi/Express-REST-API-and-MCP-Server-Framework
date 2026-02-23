# Architecture Overview

## System Architecture

The Express REST API Generator is a TypeScript-based development framework that provides both REST API endpoints and MCP (Model Context Protocol) server interfaces for LLMs.

### Core Components

1. **Application Layer**
   - Express.js REST API server
   - Route versioning system
   - Middleware pipeline (authentication, validation, caching, rate limiting)
   - Health check endpoints (`/health`, `/health/ready`, `/health/live`)
   - MCP configuration endpoints (`/mcp/config`, `/mcp/info`)
   - Graceful shutdown handlers

2. **Business Logic Layer**
   - Controllers (request handlers with MCP exposure support)
   - Services (reusable business logic)
   - Models (Mongoose/Sequelize with schema descriptions)

3. **MCP Layer**
   - Models MCP Server (exposes data as resources and tools)
   - Controllers MCP Server (exposes controller methods as tools)
   - Services MCP Server (exposes service methods as tools)
   - Unified MCP Server (combines all MCP servers)
   - **Streamable HTTP transport** at `GET/POST /mcp/http` for Cursor and other MCP clients (when `config.enableMcp` is true)
   - Per-model tools: `create_<model>`, `create_many_<model>`, `update_<model>`, `delete_<model>`; resources: `<model>://list`, `<model>://{id}`, `<model>://search`
   - Auto-registration system for generated services
   - Configuration generation endpoints (`/mcp/config`, `/mcp/info`) for LLM client setup

4. **Queue System**
   - Bull queue for background job processing
   - Job processors for async operations
   - Scheduled jobs with cron support
   - Graceful queue shutdown

5. **Data Layer**
   - MongoDB (via Mongoose) - Main and Log databases
   - SQL databases (via Sequelize) - Optional
   - Redis (caching and queue)
   - Connection retry logic with exponential backoff
   - Centralized database initialization

6. **Infrastructure Layer**
   - Database initialization service
   - Connection health monitoring
   - Retry logic with exponential backoff
   - Graceful shutdown service

## Execution Order

The application follows a strict initialization sequence:

1. **Module Load**: Configuration, database objects, queues, models
2. **Database Initialization**: All connections awaited with retry logic
3. **Express App**: Created and configured
4. **Routes**: Loaded dynamically using ES modules
5. **Server**: Starts listening
6. **MCP**: Initialized after databases ready

See [EXECUTION_ORDER.md](../EXECUTION_ORDER.md) for complete details.

## MCP Integration

The framework automatically exposes:
- **Model data** as MCP resources (read-only access)
- **Controller methods** as MCP tools (with selective exposure via JSDoc annotations)
- **Schema field descriptions** for LLM context understanding
- **Auto-registration** of generated services

## TypeScript Migration

All code has been migrated to TypeScript with:
- Strict type checking
- Type definitions for all modules
- Path aliases for cleaner imports
- Source maps for debugging
- ES module imports (dynamic route loading)

## Queue System (Bull)

Replaced Kue with Bull for:
- Better Redis integration
- Improved job processing
- Repeatable jobs for scheduling
- Better error handling and retry logic
- Graceful shutdown support

## Reliability Features

- **Connection Retry**: Exponential backoff for database connections
- **Health Checks**: Comprehensive health monitoring endpoints
- **Graceful Shutdown**: Proper resource cleanup on termination
- **Error Handling**: Comprehensive error handling throughout
- **Execution Order**: Guaranteed correct initialization sequence
