import { Request, Response } from 'express';
import { ApiKeyService } from '../services/ApiKeyService.js';

export class ApiKeyController {
  static async getApiKey(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const apiKey = await ApiKeyService.getApiKeyForUser(req.user._id.toString());
      if (!apiKey) {
        return res.json({ apiKey: null });
      }

      res.json({
        apiKey: {
          key: apiKey.key,
          name: apiKey.name,
          createdAt: apiKey.createdAt,
          lastUsedAt: apiKey.lastUsedAt
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch API key' });
    }
  }

  static async generateApiKey(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const name = req.body?.name || 'Agent Integration Key';
      const apiKey = await ApiKeyService.createOrRegenerateApiKey(req.user._id.toString(), name);

      res.status(201).json({
        apiKey: {
          key: apiKey.key,
          name: apiKey.name,
          createdAt: apiKey.createdAt,
          lastUsedAt: apiKey.lastUsedAt
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to generate API key' });
    }
  }
}
