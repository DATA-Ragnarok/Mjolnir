import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import ApiKeyModel from '../models/ApiKey.js';

declare global {
  namespace Express {
    interface Request {
      apiKey?: {
        id: string;
        scopes: string[];
        createdByUserId: string;
      };
    }
  }
}

const computeHash = (key: string): string => {
  return crypto.createHash('sha256').update(key).digest('hex');
};

export const agentAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let apiKey: string | null = null;

    // Try x-api-key header first
    const xApiKey = req.headers['x-api-key'];
    if (xApiKey && typeof xApiKey === 'string') {
      apiKey = xApiKey;
    }

    // Fall back to Authorization: Bearer
    if (!apiKey) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        apiKey = authHeader.split(' ')[1];
      }
    }

    if (!apiKey) {
      return res.status(401).json({ message: 'Unauthorized: Missing API key' });
    }

    // Compute hash and verify
    const keyHash = computeHash(apiKey);
    const dbKey = await ApiKeyModel.findOne({ keyHash, isActive: true });

    if (!dbKey) {
      return res.status(403).json({ message: 'Forbidden: Invalid or revoked API key' });
    }

    // Update lastUsedAt asynchronously (fire and forget)
    ApiKeyModel.updateOne({ _id: dbKey._id }, { lastUsedAt: new Date() }).catch(() => {
      // Silently ignore errors
    });

    // Attach key info to request
    req.apiKey = {
      id: dbKey._id.toString(),
      scopes: dbKey.scopes as string[],
      createdByUserId: dbKey.createdByUserId.toString(),
    };

    next();
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized: Authentication error' });
  }
};

export const requireScope = (requiredScope: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.apiKey) {
      return res.status(401).json({ message: 'Unauthorized: No API key attached' });
    }

    if (!req.apiKey.scopes.includes(requiredScope)) {
      return res.status(403).json({
        message: `Forbidden: Scope '${requiredScope}' not granted. Available: ${req.apiKey.scopes.join(', ')}`,
      });
    }

    next();
  };
};
