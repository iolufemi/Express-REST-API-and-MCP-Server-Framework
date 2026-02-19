/**
 * Model-level metadata utilities
 * 
 * Provides model-level information for MCP resources
 */

import type { ModelMetadata } from '../../types/models.js';
import models from '../../models/index.js';
import { extractAllModelMetadata } from './schema-metadata.js';

/**
 * Get metadata for a specific model
 */
export function getModelMetadata(modelName: string): ModelMetadata | null {
  const allMetadata = extractAllModelMetadata(models);
  return allMetadata.find(m => m.name === modelName) || null;
}

/**
 * Get metadata for all models
 */
export function getAllModelMetadata(): ModelMetadata[] {
  return extractAllModelMetadata(models);
}

/**
 * Get field metadata for a specific field in a model
 */
export function getFieldMetadata(
  modelName: string,
  fieldName: string
): import('../../types/models.js').SchemaFieldMetadata | null {
  const modelMeta = getModelMetadata(modelName);
  if (!modelMeta) {
    return null;
  }

  return modelMeta.fields.find(f => f.name === fieldName) || null;
}
