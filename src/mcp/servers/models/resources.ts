/**
 * Models MCP Resources
 *
 * Exposes model data as MCP resources with schema descriptions
 */

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import modelsPromise from '../../../models/index.js';
import { getAllModelMetadata } from '../../utils/model-metadata.js';
import type { ModelMetadata } from '../../../types/models.js';

/**
 * Register model resources with MCP server
 */
export async function registerModelResources(mcpServer: McpServer): Promise<void> {
  const modelMetadata = await getAllModelMetadata();

  for (const meta of modelMetadata) {
    const modelName = meta.name;
    const modelNameLower = modelName.toLowerCase();
    const baseUri = `${modelNameLower}://`;

    // List: e.g. item://list or item://list?limit=20&skip=0 (pagination)
    mcpServer.registerResource(
      `list_${modelNameLower}`,
      `${baseUri}list`,
      {
        description:
          (meta.description || `List all ${modelName} records`) +
          '. Use ?limit=N&skip=M for pagination (e.g. skip=0 for first page, skip=limit for next).',
        mimeType: 'application/json'
      },
      async (uri) => {
        const query: Record<string, unknown> = {};
        const limit = uri.searchParams.has('limit') ? Number(uri.searchParams.get('limit')) : 50;
        const skip = uri.searchParams.has('skip') ? Number(uri.searchParams.get('skip')) : 0;
        query.limit = limit;
        query.skip = skip;
        const data = (await getModelListResource(modelName, query as Record<string, unknown>)) as {
          data: unknown[];
          metadata: { total: number; limit: number; skip: number };
        };
        const total = data.metadata?.total ?? 0;
        const hasMore = skip + (data.data?.length ?? 0) < total;
        const nextSkip = skip + limit;
        const pagination = {
          limit,
          skip,
          total,
          hasMore,
          nextPageUri: hasMore ? `${baseUri}list?limit=${limit}&skip=${nextSkip}` : null
        };
        const payload = { ...data, pagination };
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: 'application/json',
              text: JSON.stringify(payload)
            }
          ]
        };
      }
    );

    // Search: e.g. item://search?q=...
    mcpServer.registerResource(
      `search_${modelNameLower}`,
      `${baseUri}search`,
      {
        description: `Search ${modelName} records with full-text search`,
        mimeType: 'application/json'
      },
      async (uri) => {
        const searchQuery = uri.searchParams.get('q') || uri.searchParams.get('query') || '';
        const data = await getModelSearchResource(modelName, searchQuery).catch((): { data: unknown[]; metadata: { model: string; fields: ModelMetadata['fields']; query: string } } => ({
          data: [],
          metadata: { model: modelName, fields: meta.fields || [], query: searchQuery }
        }));
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: 'application/json',
              text: JSON.stringify(data)
            }
          ]
        };
      }
    );

    // Single record: e.g. item://{id} (also handles list? and search? when SDK routes them here)
    const idTemplate = new ResourceTemplate(`${baseUri}{id}`, { list: undefined });
    mcpServer.registerResource(
      `get_${modelNameLower}`,
      idTemplate,
      {
        description: meta.description || `Get a specific ${modelName} record by ID`,
        mimeType: 'application/json'
      },
      async (uri, variables) => {
        const id = variables?.id as string | undefined;
        if (!id) {
          return {
            contents: [
              {
                uri: uri.href,
                mimeType: 'application/json',
                text: JSON.stringify({ error: 'Missing id in URI' })
              }
            ]
          };
        }
        // Handle list with query params (e.g. id is "list?limit=50&skip=50" when URI is items://list?limit=50&skip=50)
        if (id === 'list' || id.startsWith('list?')) {
          const qs = id.includes('?') ? id.slice(id.indexOf('?') + 1) : '';
          const params = new URLSearchParams(qs);
          const query: Record<string, unknown> = {};
          const limit = params.has('limit') ? Number(params.get('limit')) : 50;
          const skip = params.has('skip') ? Number(params.get('skip')) : 0;
          query.limit = limit;
          query.skip = skip;
          const data = (await getModelListResource(modelName, query as Record<string, unknown>)) as {
            data: unknown[];
            metadata: { total: number; limit: number; skip: number };
          };
          const total = data.metadata?.total ?? 0;
          const hasMore = skip + (data.data?.length ?? 0) < total;
          const nextSkip = skip + limit;
          const pagination = {
            limit,
            skip,
            total,
            hasMore,
            nextPageUri: hasMore ? `${baseUri}list?limit=${limit}&skip=${nextSkip}` : null
          };
          const payload = { ...data, pagination };
          return {
            contents: [
              { uri: uri.href, mimeType: 'application/json', text: JSON.stringify(payload) }
            ]
          };
        }
        // Handle search with query params (e.g. id is "search?q=..." when URI is items://search?q=...)
        if (id === 'search' || id.startsWith('search?')) {
          const qs = id.includes('?') ? id.slice(id.indexOf('?') + 1) : '';
          const params = new URLSearchParams(qs);
          const searchQuery = params.get('q') || params.get('query') || '';
          const data = await getModelSearchResource(modelName, searchQuery).catch((): { data: unknown[]; metadata: { model: string; fields: ModelMetadata['fields']; query: string } } => ({
            data: [],
            metadata: { model: modelName, fields: meta.fields || [], query: searchQuery }
          }));
          return {
            contents: [
              { uri: uri.href, mimeType: 'application/json', text: JSON.stringify(data) }
            ]
          };
        }
        const data = await getModelRecordResource(modelName, id);
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: 'application/json',
              text: JSON.stringify(data)
            }
          ]
        };
      }
    );
  }
}

/**
 * Get resource content for a model list
 */
export async function getModelListResource(
  modelName: string,
  query?: Record<string, unknown>
): Promise<unknown> {
  const models = await modelsPromise;
  const Model = models[modelName];
  if (!Model) {
    throw new Error(`Model ${modelName} not found`);
  }

  const allMetadata = await getAllModelMetadata();
  const metadata = allMetadata.find((m) => m.name === modelName);
  const limit = (query?.limit as number) || 50;
  const skip = (query?.skip as number) || 0;
  const filter = { ...query };
  delete filter.limit;
  delete filter.skip;

  const results = await (Model as { find: (q: object) => { limit: (n: number) => { skip: (n: number) => { lean: () => Promise<unknown[]> } } } })
    .find(filter)
    .limit(limit)
    .skip(skip)
    .lean();

  return {
    data: results,
    metadata: {
      model: modelName,
      fields: metadata?.fields || [],
      total: await (Model as { estimatedDocumentCount: (q: object) => Promise<number> }).estimatedDocumentCount(filter),
      limit,
      skip
    }
  };
}

/**
 * Get resource content for a single model record
 */
export async function getModelRecordResource(
  modelName: string,
  id: string
): Promise<unknown> {
  const models = await modelsPromise;
  const Model = models[modelName];
  if (!Model) {
    throw new Error(`Model ${modelName} not found`);
  }

  const allMetadata = await getAllModelMetadata();
  const metadata = allMetadata.find((m) => m.name === modelName);
  const record = await (Model as { findById: (id: string) => { lean: () => Promise<unknown> } }).findById(id).lean();

  if (!record) {
    throw new Error(`Record ${id} not found in ${modelName}`);
  }

  return {
    data: record,
    metadata: {
      model: modelName,
      fields: metadata?.fields || []
    }
  };
}

/**
 * Get resource content for model search
 */
export async function getModelSearchResource(
  modelName: string,
  searchQuery: string
): Promise<unknown> {
  const models = await modelsPromise;
  const Model = models[modelName];
  if (!Model) {
    throw new Error(`Model ${modelName} not found`);
  }

  const allMetadata = await getAllModelMetadata();
  const metadata = allMetadata.find((m) => m.name === modelName);
  const search = (Model as unknown as { search?: (q: string) => { lean: () => Promise<unknown[]> } }).search;
  const results = search
    ? await search.call(Model, searchQuery).lean()
    : [];

  return {
    data: results,
    metadata: {
      model: modelName,
      fields: metadata?.fields || [],
      query: searchQuery
    }
  };
}
