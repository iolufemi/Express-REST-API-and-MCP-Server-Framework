/**
 * Schema Metadata Extraction Utilities
 * 
 * Extracts description and mcpDescription fields from model schemas
 * for use in MCP resource and tool metadata
 */

import { SchemaFieldDefinition, SchemaFieldMetadata, ModelMetadata } from '../../types/models.js';
import { MongooseModelType, SequelizeModelType } from '../../types/models.js';
import { ModelRegistry } from '../../types/models.js';

/**
 * Extract field metadata from a schema field definition
 */
export function extractFieldMetadata(
  fieldName: string,
  fieldDef: SchemaFieldDefinition
): SchemaFieldMetadata {
  return {
    name: fieldName,
    type: typeof fieldDef.type === 'string' ? fieldDef.type : (fieldDef.type && typeof fieldDef.type === 'object' && 'name' in fieldDef.type ? (fieldDef.type as { name?: string }).name : undefined) || 'Mixed',
    description: fieldDef.description as string | undefined,
    mcpDescription: fieldDef.mcpDescription as string | undefined,
    required: fieldDef.required || false,
    enum: fieldDef.enum,
    default: fieldDef.default,
    constraints: {
      min: fieldDef.min,
      max: fieldDef.max,
      pattern: fieldDef.pattern as string | undefined
    }
  };
}

/**
 * Extract metadata from a Mongoose model schema
 */
export function extractMongooseModelMetadata(
  modelName: string,
  model: MongooseModelType
): ModelMetadata | null {
  try {
    const schema = (model as any).schema;
    if (!schema) {
      return null;
    }

    const fields: SchemaFieldMetadata[] = [];
    const schemaPaths = schema.paths;

    for (const pathName in schemaPaths) {
      const path = schemaPaths[pathName];
      const fieldDef: SchemaFieldDefinition = {
        type: path.instance || 'Mixed',
        required: path.isRequired || false,
        unique: path.unique || false,
        default: path.defaultValue,
        enum: path.enumValues,
        description: (path.options)?.description,
        mcpDescription: (path.options)?.mcpDescription
      };

      fields.push(extractFieldMetadata(pathName, fieldDef));
    }

    return {
      name: modelName,
      collection: (model as any).collection?.name,
      fields,
      description: (schema.options)?.description,
      mcpDescription: (schema.options)?.mcpDescription
    };
  } catch (error) {
    console.error(`Error extracting metadata from model ${modelName}:`, error);
    return null;
  }
}

/**
 * Extract metadata from a Sequelize model
 */
export function extractSequelizeModelMetadata(
  modelName: string,
  model: SequelizeModelType
): ModelMetadata | null {
  try {
    const attributes = (model as any).rawAttributes || {};
    const fields: SchemaFieldMetadata[] = [];

    for (const attrName in attributes) {
      const attr = attributes[attrName];
      const fieldDef: SchemaFieldDefinition = {
        type: attr.type?.toString() || 'STRING',
        required: !attr.allowNull,
        unique: attr.unique || false,
        default: attr.defaultValue,
        description: attr.description,
        mcpDescription: attr.mcpDescription
      };

      fields.push(extractFieldMetadata(attrName, fieldDef));
    }

    return {
      name: modelName,
      table: (model as any).tableName,
      fields,
      description: (model as any).options?.description,
      mcpDescription: (model as any).options?.mcpDescription
    };
  } catch (error) {
    console.error(`Error extracting metadata from Sequelize model ${modelName}:`, error);
    return null;
  }
}

/**
 * Extract metadata from an API model (external API as data source)
 */
export function extractApiModelMetadata(
  modelName: string,
  model: any
): ModelMetadata | null {
  try {
    const schema = (model)._schema;
    if (!schema || !schema.paths) {
      return null;
    }

    const fields: SchemaFieldMetadata[] = [];
    const schemaPaths = schema.paths;

    for (const pathName in schemaPaths) {
      const pathDef = schemaPaths[pathName];
      const fieldDef: SchemaFieldDefinition = {
        type: pathDef.type || 'Mixed',
        required: pathDef.required || false,
        unique: pathDef.unique || false,
        default: pathDef.default,
        enum: pathDef.enum,
        description: pathDef.description,
        mcpDescription: pathDef.mcpDescription
      };

      fields.push(extractFieldMetadata(pathName, fieldDef));
    }

    return {
      name: modelName,
      fields,
      description: (schema.options)?.description,
      mcpDescription: (schema.options)?.mcpDescription
    };
  } catch (error) {
    console.error(`Error extracting metadata from API model ${modelName}:`, error);
    return null;
  }
}

/**
 * Extract metadata from all models in the registry
 */
export function extractAllModelMetadata(models: ModelRegistry): ModelMetadata[] {
  const metadata: ModelMetadata[] = [];

  for (const modelName in models) {
    const model = models[modelName];
    
    // Try Mongoose first
    if ((model as any).schema) {
      const meta = extractMongooseModelMetadata(modelName, model as MongooseModelType);
      if (meta) {
        metadata.push(meta);
      }
    } else if ((model as any)._schema) {
      // Try API model (has _schema property)
      const meta = extractApiModelMetadata(modelName, model);
      if (meta) {
        metadata.push(meta);
      }
    } else {
      // Try Sequelize
      const meta = extractSequelizeModelMetadata(modelName, model as SequelizeModelType);
      if (meta) {
        metadata.push(meta);
      }
    }
  }

  return metadata;
}
