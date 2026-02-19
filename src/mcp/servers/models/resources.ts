/**
 * Models MCP Resources
 * 
 * Exposes model data as MCP resources with schema descriptions
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { Resource } from '@modelcontextprotocol/sdk/types.js';
import models from '../../../models/index.js';
import { getAllModelMetadata } from '../../utils/model-metadata.js';
import type { ModelMetadata } from '../../../types/models.js';

/**
 * Register model resources with MCP server
 */
export function registerModelResources(_server: Server): void {
  const modelMetadata = getAllModelMetadata();

  // Register list resource for each model
  modelMetadata.forEach((meta: ModelMetadata) => {
    const listURI = `${meta.name.toLowerCase()}://list`;
    // Resource handler would be registered here
    // For now, we're just defining the structure
    // @ts-ignore - Placeholder for future implementation
    const _resource: Resource = {
      uri: listURI,
      name: `List ${meta.name}`,
      description: meta.description || `List all ${meta.name} records`,
      mimeType: 'application/json'
    };
  });

  // Register individual record resources
  modelMetadata.forEach((meta: ModelMetadata) => {
    const recordURI = `${meta.name.toLowerCase()}://{id}`;
    // @ts-ignore - Placeholder for future implementation
    const _resource: Resource = {
      uri: recordURI,
      name: `Get ${meta.name} by ID`,
      description: meta.description || `Get a specific ${meta.name} record by ID`,
      mimeType: 'application/json'
    };
  });

  // Register search resource
  modelMetadata.forEach((meta: ModelMetadata) => {
    const searchURI = `${meta.name.toLowerCase()}://search`;
    // @ts-ignore - Placeholder for future implementation
    const _resource: Resource = {
      uri: searchURI,
      name: `Search ${meta.name}`,
      description: `Search ${meta.name} records with full-text search`,
      mimeType: 'application/json'
    };
  });
}

/**
 * Get resource content for a model list
 */
export async function getModelListResource(
  modelName: string,
  query?: any
): Promise<any> {
  const Model = models[modelName];
  if (!Model) {
    throw new Error(`Model ${modelName} not found`);
  }

  const metadata = getAllModelMetadata().find(m => m.name === modelName);
  const limit = query?.limit || 50;
  const skip = query?.skip || 0;

  const results = await (Model as any).find(query || {})
    .limit(limit)
    .skip(skip)
    .lean();

  return {
    data: results,
    metadata: {
      model: modelName,
      fields: metadata?.fields || [],
      total: await (Model as any).estimatedDocumentCount(query || {}),
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
): Promise<any> {
  const Model = models[modelName];
  if (!Model) {
    throw new Error(`Model ${modelName} not found`);
  }

  const metadata = getAllModelMetadata().find(m => m.name === modelName);
  const record = await (Model as any).findById(id).lean();

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
): Promise<any> {
  const Model = models[modelName];
  if (!Model) {
    throw new Error(`Model ${modelName} not found`);
  }

  const metadata = getAllModelMetadata().find(m => m.name === modelName);
  const results = await (Model as any).search(searchQuery).lean();

  return {
    data: results,
    metadata: {
      model: modelName,
      fields: metadata?.fields || [],
      query: searchQuery
    }
  };
}
