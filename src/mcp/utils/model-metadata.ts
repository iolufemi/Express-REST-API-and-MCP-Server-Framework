/**
 * Model-level metadata utilities
 *
 * Provides model-level information for MCP resources
 */

import type { ModelMetadata } from '../../types/models.js';
import modelsPromise from '../../models/index.js';
import { extractAllModelMetadata } from './schema-metadata.js';

/**
 * Get metadata for a specific model
 */
export async function getModelMetadata(modelName: string): Promise<ModelMetadata | null> {
  const models = await modelsPromise;
  const allMetadata = extractAllModelMetadata(models);
  return allMetadata.find(m => m.name === modelName) || null;
}

/**
 * Get metadata for all models
 */
export async function getAllModelMetadata(): Promise<ModelMetadata[]> {
  const models = await modelsPromise;
  return extractAllModelMetadata(models);
}

/**
 * Get field metadata for a specific field in a model
 */
export async function getFieldMetadata(
  modelName: string,
  fieldName: string
): Promise<import('../../types/models.js').SchemaFieldMetadata | null> {
  const modelMeta = await getModelMetadata(modelName);
  if (!modelMeta) {
    return null;
  }

  return modelMeta.fields.find(f => f.name === fieldName) || null;
}
