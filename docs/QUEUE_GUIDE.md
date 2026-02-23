# Bull Queue Guide

## Overview

The framework uses Bull for background job processing, replacing the previous Kue implementation.

## Redis: separate connection for queue vs cache

Cache (API response cache, rate limiting) and the job queue use **separate Redis connections** so heavy queue traffic does not block cache reads/writes.

- **Cache** uses `REDIS_URL` (default `redis://127.0.0.1:6379/1`) via `src/services/database/redis.js`.
- **Queue (Bull)** uses `REDIS_QUEUE_URL` (default `redis://127.0.0.1:6379/2`).

Using different DB numbers on the same host (e.g. `/1` for cache, `/2` for queue) gives separate connections and key isolation. For full isolation under load, point `REDIS_QUEUE_URL` at a different Redis instance (e.g. another host or port).

## Queue Types

- `searchIndex` - Create search tags for database records
- `logRequest` - Log API requests
- `logResponse` - Log API responses
- `saveToTrash` - Backup deleted data to trash
- `sendWebhook` - Send webhook events
- `sendHTTPRequest` - Make HTTP requests

## Creating Jobs

```typescript
import queue from './services/queue';

// Create a job
await queue.create('logRequest', {
  RequestId: '...',
  ipAddress: '...',
  url: '...',
  method: 'GET',
  body: {}
}).save();
```

## Job Processors

Job processors are defined in `src/services/queue/workers.ts`. Each queue has a processor that handles jobs.

## Scheduled Jobs

Use the queue clock to schedule recurring jobs:

```typescript
import queue from './services/queue';

// Schedule a job
await queue.addSchedule(
  '0 0 * * *', // Cron expression (daily at midnight)
  'daily-cleanup',
  'saveToTrash',
  { /* job data */ }
);
```

## Job Options

Jobs support:
- Retry attempts (default: 3)
- Exponential backoff
- Job removal policies
- Job priorities

## Monitoring

Use Bull Board or similar tools to monitor queue status and job processing.
