import encryption from '../services/encryption/index.js';
import { ExpressRequest, ExpressResponse, ExpressNext } from '../types/express.js';

const InitializeController = {
  /**
   * Initialize encryption and get x-tag for secure communication
   * @mcp.expose true
   * @mcp.toolName initializeEncryption
   * @mcp.description Generate an encryption key (x-tag) for secure API communication
   */
  init: async function (_req: ExpressRequest, res: ExpressResponse, next: ExpressNext): Promise<void> {
    try {
      const resp = await encryption.generateKey();
      res.ok?.({ 'x-tag': resp });
    } catch (err: unknown) {
      next(err instanceof Error ? err : new Error(String(err)));
    }
  }
};

export default InitializeController;
