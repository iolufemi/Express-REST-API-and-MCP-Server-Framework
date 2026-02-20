/**
 * Schema Discovery Service
 *
 * Fetches schema from external API endpoints (GET {baseurl}/{endpoint}/schema),
 * parses JSON Schema and converts to internal SchemaFieldDefinition format.
 * On failure returns null so the controller can fall back to existing _schema.
 */

import axios, { AxiosRequestConfig } from 'axios';
import { SchemaFieldDefinition, SchemaFieldMetadata, ModelMetadata } from '../../types/models.js';

const SCHEMA_ENDPOINT_PATH = '/schema';
const REQUEST_TIMEOUT_MS = 10000;

/** JSON Schema property definition (subset we support) */
interface JsonSchemaProperty {
  type?: string | string[];
  description?: string;
  enum?: unknown[];
  default?: unknown;
  format?: string;
  items?: { type?: string };
  [key: string]: unknown;
}

/** JSON Schema root (subset we support) */
interface JsonSchemaRoot {
  type?: string;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
  description?: string;
  [key: string]: unknown;
}

/** HTTP client interface for fetching (test-injectable). */
export type SchemaDiscoveryHttpClient = (config: AxiosRequestConfig) => Promise<{ data: unknown; status: number }>;

/**
 * Fetch remote schema from GET {baseurl}/{endpoint}/schema
 * Returns parsed JSON or null on failure (caller can fall back to existing schema).
 * @param httpClient - Optional client for tests; uses axios when omitted.
 */
export async function fetchRemoteSchema(
  baseurl: string,
  endpoint: string,
  headers: Record<string, string> = {},
  httpClient: SchemaDiscoveryHttpClient = axios as SchemaDiscoveryHttpClient
): Promise<unknown> {
  const base = baseurl.replace(/\/$/, '');
  const path = endpoint.replace(/^\//, '');
  const url = `${base}/${path}${SCHEMA_ENDPOINT_PATH}`;

  const options: AxiosRequestConfig = {
    method: 'GET',
    url,
    headers: { 'Content-Type': 'application/json', ...headers },
    timeout: REQUEST_TIMEOUT_MS,
    responseType: 'json',
    validateStatus: (status) => status >= 200 && status < 300
  };

  try {
    const response = await httpClient(options);
    return response.data;
  } catch (err: unknown) {
    const message = axios.isAxiosError(err)
      ? err.response?.status
        ? `Schema endpoint returned ${err.response.status}`
        : err.message || 'Schema request failed'
      : err instanceof Error
        ? err.message
        : 'Schema request failed';
    console.warn(`[schema-discovery] ${message} for ${url}`);
    return null;
  }
}

/** Map JSON Schema type(s) to internal type name string */
function jsonSchemaTypeToInternalType(prop: JsonSchemaProperty): string {
  const t = prop.type;
  if (Array.isArray(t)) {
    const first = t.find((x) => x !== 'null');
    return jsonSchemaSingleTypeToInternal(first ?? 'string');
  }
  return jsonSchemaSingleTypeToInternal(typeof t === 'string' ? t : 'string');
}

function jsonSchemaSingleTypeToInternal(t: string): string {
  switch (t) {
    case 'string':
      return 'String';
    case 'number':
    case 'integer':
      return 'Number';
    case 'boolean':
      return 'Boolean';
    case 'array':
      return 'Array';
    case 'object':
      return 'Object';
    case 'null':
      return 'Mixed';
    default:
      return t ? String(t) : 'Mixed';
  }
}

/**
 * Convert JSON Schema (with properties) to internal SchemaFieldDefinition record.
 * Handles missing or empty properties; does not throw on invalid input.
 */
export function jsonSchemaToSchemaFieldDefinitions(jsonSchema: unknown): Record<string, SchemaFieldDefinition> {
  const paths: Record<string, SchemaFieldDefinition> = {};

  if (!jsonSchema || typeof jsonSchema !== 'object') {
    return paths;
  }

  const schema = jsonSchema as JsonSchemaRoot;
  const properties = schema.properties;
  const requiredList = Array.isArray(schema.required) ? schema.required : [];

  if (!properties || typeof properties !== 'object') {
    return paths;
  }

  for (const fieldName of Object.keys(properties)) {
    const prop = properties[fieldName] as JsonSchemaProperty | undefined;
    if (!prop || typeof prop !== 'object') {
      continue;
    }

    const typeName = jsonSchemaTypeToInternalType(prop);
    const def: SchemaFieldDefinition = {
      type: typeName,
      required: requiredList.includes(fieldName),
      description: typeof prop.description === 'string' ? prop.description : undefined,
      mcpDescription: typeof prop.description === 'string' ? prop.description : undefined,
      enum: Array.isArray(prop.enum) ? prop.enum : undefined,
      default: prop.default
    };
    paths[fieldName] = def;
  }

  return paths;
}

/**
 * Build ModelMetadata from paths and optional options (for discovery response).
 */
export function buildModelMetadata(
  modelName: string,
  paths: Record<string, SchemaFieldDefinition>,
  options: { description?: string; mcpDescription?: string } = {}
): ModelMetadata {
  const fields: SchemaFieldMetadata[] = [];

  for (const pathName of Object.keys(paths)) {
    const pathDef = paths[pathName];
    const typeStr =
      typeof pathDef.type === 'string' ? pathDef.type : (pathDef.type as { name?: string })?.name ?? 'Mixed';
    fields.push({
      name: pathName,
      type: typeStr,
      description: pathDef.description as string | undefined,
      mcpDescription: pathDef.mcpDescription as string | undefined,
      required: pathDef.required ?? false,
      enum: pathDef.enum,
      default: pathDef.default,
      constraints: {
        min: pathDef.min,
        max: pathDef.max,
        pattern: pathDef.pattern as string | undefined
      }
    });
  }

  return {
    name: modelName,
    fields,
    description: typeof options.description === 'string' ? options.description : undefined,
    mcpDescription: typeof options.mcpDescription === 'string' ? options.mcpDescription : undefined
  };
}

/**
 * Discover schema for an API model. Returns ModelMetadata on success, null on failure.
 * Controller should fall back to existing _schema when this returns null.
 * @param model - API model instance with _baseurl, _endpoint, and optionally _schema
 * @param modelName - Name for the returned metadata (e.g. "Externaldatas"); defaults to endpoint
 * @param httpClient - Optional HTTP client for tests; uses axios when omitted.
 */
export async function discoverSchemaForApiModel(
  model: any,
  modelName?: string,
  httpClient?: SchemaDiscoveryHttpClient
): Promise<ModelMetadata | null> {
  const baseurl = model?._baseurl;
  const endpoint = model?._endpoint;

  if (typeof baseurl !== 'string' || typeof endpoint !== 'string') {
    return null;
  }

  const headers: Record<string, string> = {};
  const raw = await fetchRemoteSchema(baseurl, endpoint, headers, httpClient);
  if (raw === null) {
    return null;
  }

  let paths: Record<string, SchemaFieldDefinition>;
  try {
    paths = jsonSchemaToSchemaFieldDefinitions(raw);
  } catch (err) {
    console.warn('[schema-discovery] Failed to convert JSON Schema:', err);
    return null;
  }

  if (Object.keys(paths).length === 0) {
    console.warn('[schema-discovery] No properties in schema, returning null');
    return null;
  }

  const existingSchema = model?._schema;
  const options: { description?: string; mcpDescription?: string } = existingSchema?.options
    ? {
        description: typeof (existingSchema.options).description === 'string' ? (existingSchema.options).description : undefined,
        mcpDescription: typeof (existingSchema.options).mcpDescription === 'string' ? (existingSchema.options).mcpDescription : undefined
      }
    : {};

  const name = modelName ?? endpoint;

  return buildModelMetadata(name, paths, options);
}
