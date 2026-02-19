# Migration Guide

## From JavaScript to TypeScript

This guide helps you migrate existing projects or understand the changes made during modernization.

## Key Changes

### 1. TypeScript Migration

All JavaScript files have been migrated to TypeScript:
- `.js` → `.ts` files
- Added type definitions throughout
- Strict type checking enabled

### 2. Queue System: Kue → Bull

The queue system has been migrated from Kue to Bull:

**Before (Kue):**
```javascript
var queue = require('./services/queue');
queue.create('jobName', data).save();
```

**After (Bull):**
```typescript
import queue from './services/queue';
await queue.create('jobName', data).save();
```

### 3. Dependencies Updated

- Express: ^4.15.2 → ^4.21.1
- Mongoose: ^6.5.0 → ^8.8.4
- Sequelize: ^6.0.0 → ^6.37.5
- Redis: ^3.1.1 → ^4.7.0
- Winston: ^2.3.1 → ^3.15.1
- Removed: `kue`, `q`, `request`, `request-promise`
- Added: `bull`, `axios`, `typescript`, `@modelcontextprotocol/sdk`

### 4. MCP Integration

New MCP features:
- Automatic exposure of models as resources
- Automatic exposure of controller methods as tools
- Schema field descriptions for LLM context
- Selective exposure via JSDoc annotations

### 5. Build System

**Before:**
```bash
node app.js
```

**After:**
```bash
npm run build  # Compile TypeScript
npm start      # Run compiled JavaScript
npm run dev    # Development with hot reload
```

## Breaking Changes

1. **Node.js Version**: Requires Node.js 22.x
2. **Queue API**: Kue API replaced with Bull API
3. **Request Library**: `request`/`request-promise` replaced with `axios`
4. **Promise Library**: `q` replaced with native Promises/async-await
5. **Type Safety**: All code now requires proper TypeScript types

## Migration Steps

1. Update Node.js to version 22.x
2. Install dependencies: `npm install`
3. Build TypeScript: `npm run build`
4. Update any custom queue jobs to use Bull API
5. Update any code using `request` to use `axios`
6. Add type annotations to custom code
7. Test thoroughly

## Testing

Run tests to ensure everything works:
```bash
npm test
npm run test:coverage
```
