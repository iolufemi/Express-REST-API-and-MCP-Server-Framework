/**
 * Example: Custom Service with MCP Exposure
 *
 * Shows how to create a custom controller method and expose it to MCP using JSDoc annotations.
 * Assumes a Mongoose model named Users exists (e.g. generated with `npm run generate -- -n User`).
 */

import { ExpressRequest, ExpressResponse, ExpressNext } from '../src/types/express.js';
import type { MongooseModelType } from '../src/types/models.js';
import models from '../src/models/index.js';

const UsersController = {
  // Standard CRUD methods are auto-exposed

  /**
   * Custom method with MCP exposure
   * @mcp.expose true
   * @mcp.toolName sendWelcomeEmail
   * @mcp.description Send a welcome email to a user after registration
   */
  sendWelcomeEmail: async function (req: ExpressRequest, res: ExpressResponse, next: ExpressNext): Promise<void> {
    try {
      const userId = req.params.id;
      const usersModel = models.Users;
      if (!usersModel) {
        return res.serverError?.({ message: 'Users model not registered' });
      }
      // ModelRegistry is MongooseModelType | SequelizeModelType; findById is Mongoose-only.
      const user = await (usersModel as MongooseModelType).findById(userId);

      if (!user) {
        return res.notFound?.();
      }

      // Send welcome email logic here
      // ...

      res.ok?.({ message: 'Welcome email sent', userId });
    } catch (err: any) {
      next(err);
    }
  },

  /**
   * Another custom method
   * @mcp.expose true
   * @mcp.toolName getUserStats
   * @mcp.description Get statistics for a user account
   */
  getUserStats: async function (req: ExpressRequest, res: ExpressResponse, next: ExpressNext): Promise<void> {
    try {
      const userId = req.params.id;
      
      // Calculate user statistics
      const stats = {
        totalPosts: 0,
        totalComments: 0,
        joinDate: new Date()
      };

      res.ok?.(stats);
    } catch (err: any) {
      next(err);
    }
  }
};

export default UsersController;
