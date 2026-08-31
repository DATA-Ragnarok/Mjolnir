import { Request, Response, NextFunction } from 'express';
import { ApiKeyService } from '../services/ApiKeyService.js';

export const agentAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if valid sessionId provided from established SSE session
    const sessionId = req.query?.['sessionId'];
    if (typeof sessionId === 'string' && sessionId) {
      const getSession = (global as any).__mcpGetSession;
      if (getSession) {
        const session = getSession(sessionId);
        if (session && session.user) {
          if (!session.user.isApproved) {
            return res.status(403).json({ message: 'User not approved' });
          }
          req.user = session.user;
          return next();
        }
      }
    }

    let key: string | undefined;

    // Check x-api-key header
    const xApiKey = req.headers['x-api-key'];
    if (typeof xApiKey === 'string' && xApiKey.trim()) {
      key = xApiKey.trim();
    }

    // Check Authorization: Bearer mj_live_...
    if (!key && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7).trim();
        if (token.startsWith('mj_live_')) {
          key = token;
        }
      }
    }

    // Check query params for SSE / query auth
    if (!key && req.query) {
      if (typeof req.query['x-api-key'] === 'string') {
        key = req.query['x-api-key'];
      } else if (typeof req.query['apiKey'] === 'string') {
        key = req.query['apiKey'];
      }
    }

    if (!key) {
      return res.status(401).json({ message: 'API key is required' });
    }

    const user = await ApiKeyService.validateApiKey(key);
    if (!user) {
      return res.status(401).json({ message: 'Invalid or expired API key' });
    }

    if (!user.isApproved) {
      return res.status(403).json({ message: 'User not approved' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication error' });
  }
};
