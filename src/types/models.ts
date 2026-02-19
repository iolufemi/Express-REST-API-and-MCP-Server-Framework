/**
 * Model type definitions
 */

import { Document, Model as MongooseModel } from 'mongoose';
import { Model as SequelizeModel, ModelStatic } from 'sequelize';

/**
 * Schema field definition with description support for MCP
 */
export interface SchemaFieldDefinition {
  type: any;
  required?: boolean;
  unique?: boolean;
  default?: any;
  enum?: any[];
  min?: number;
  max?: number;
  ref?: string;
  index?: boolean | string | object;
  description?: string; // General description for API docs
  mcpDescription?: string; // Detailed description for LLM context
  [key: string]: any;
}

/**
 * Mongoose schema object with field descriptions
 */
export interface MongooseSchemaObject {
  [key: string]: SchemaFieldDefinition | any;
}

/**
 * Sequelize schema object with field descriptions
 */
export interface SequelizeSchemaObject {
  [key: string]: SchemaFieldDefinition | any;
}

/**
 * Base model interface
 */
export interface BaseModel {
  _id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  owner?: string;
  createdBy?: string;
  client?: string;
  developer?: string;
  tags?: string[];
  [key: string]: any;
}

/**
 * Mongoose document type
 */
export type MongooseDocument<T = any> = Document & T & BaseModel;

/**
 * Mongoose model type
 */
export type MongooseModelType<T = any> = MongooseModel<MongooseDocument<T>> & {
  search?: (string: string) => any;
  estimatedDocumentCount?: (query?: any) => any;
};

/**
 * Sequelize model type
 */
export type SequelizeModelType<T = any> = ModelStatic<SequelizeModel<T & BaseModel>>;

/**
 * Model registry type
 */
export interface ModelRegistry {
  [key: string]: MongooseModelType | SequelizeModelType;
}

/**
 * Schema field metadata for MCP
 */
export interface SchemaFieldMetadata {
  name: string;
  type: string;
  description?: string;
  mcpDescription?: string;
  required?: boolean;
  enum?: any[];
  default?: any;
  constraints?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

/**
 * Model metadata for MCP
 */
export interface ModelMetadata {
  name: string;
  collection?: string;
  table?: string;
  fields: SchemaFieldMetadata[];
  description?: string;
  mcpDescription?: string;
}
