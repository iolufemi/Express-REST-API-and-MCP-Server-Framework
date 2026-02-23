/**
 * Models MCP Tools
 *
 * Exposes model operations as MCP tools
 */

import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import modelsPromise from '../../../models/index.js';
import { getAllModelMetadata } from '../../utils/model-metadata.js';

/**
 * Register model tools with MCP server
 */
export async function registerModelTools(mcpServer: McpServer): Promise<void> {
  const modelMetadata = await getAllModelMetadata();
  const models = await modelsPromise;

  for (const meta of modelMetadata) {
    const modelName = meta.name;
    const modelNameLower = modelName.toLowerCase();
    const Model = models[modelName] as {
      create: (data: object) => Promise<unknown>;
      insertMany?: (docs: object[]) => Promise<unknown[]>;
      bulkCreate?: (records: object[]) => Promise<unknown[]>;
      findByIdAndUpdate: (id: string, data: object, opts?: { new: boolean }) => { lean: () => Promise<unknown> };
      findByIdAndDelete?: (id: string) => { lean: () => Promise<unknown> };
      findByIdAndRemove?: (id: string) => { lean: () => Promise<unknown> };
    } | undefined;

    if (!Model) continue;

    mcpServer.registerTool(
      `create_${modelNameLower}`,
      {
        description: meta.description || `Create a new ${modelName} record`,
        inputSchema: z.record(z.unknown())
      },
      async (args: Record<string, unknown> | undefined) => {
        const created = await Model.create(args || {});
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(created)
            }
          ]
        };
      }
    );

    mcpServer.registerTool(
      `create_many_${modelNameLower}`,
      {
        description: `Create multiple ${modelName} records in one call. Pass an array of objects in the \`items\` argument.`,
        inputSchema: z.object({ items: z.array(z.record(z.unknown())) })
      },
      async (args: { items: Record<string, unknown>[] } | undefined) => {
        const items = args?.items ?? [];
        if (items.length === 0) {
          return {
            content: [{ type: 'text' as const, text: JSON.stringify({ created: 0, data: [], message: 'No items provided' }) }]
          };
        }
        const M = Model as {
          insertMany?: (docs: object[]) => Promise<unknown[]>;
          bulkCreate?: (records: object[]) => Promise<unknown[]>;
          create: (data: object) => Promise<unknown>;
        };
        let created: unknown[];
        if (typeof M.insertMany === 'function') {
          created = await M.insertMany(items);
        } else if (typeof M.bulkCreate === 'function') {
          created = await M.bulkCreate(items);
        } else {
          created = await Promise.all(items.map((doc) => Model.create(doc)));
        }
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                created: Array.isArray(created) ? created.length : 1,
                data: created
              })
            }
          ]
        };
      }
    );

    mcpServer.registerTool(
      `update_${modelNameLower}`,
      {
        description: `Update an existing ${modelName} record`,
        inputSchema: z.object({ id: z.string(), data: z.record(z.unknown()) })
      },
      async (args: { id: string; data: Record<string, unknown> } | undefined) => {
        const { id, data } = args ?? { id: '', data: {} };
        const updated = await Model.findByIdAndUpdate(id, data, { new: true }).lean();
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(updated)
            }
          ]
        };
      }
    );

    const deleteMethod = Model.findByIdAndDelete ?? Model.findByIdAndRemove;
    mcpServer.registerTool(
      `delete_${modelNameLower}`,
      {
        description: `Delete a ${modelName} record (moves to trash if supported)`,
        inputSchema: z.object({ id: z.string() })
      },
      async (args: { id: string } | undefined) => {
        const id = args?.id;
        if (!id) {
          return {
            content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Missing id' }) }],
            isError: true
          };
        }
        if (deleteMethod) {
          const deleted = await deleteMethod.call(Model, id).lean();
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(deleted)
              }
            ]
          };
        }
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Delete not supported' }) }],
          isError: true
        };
      }
    );
  }
}
