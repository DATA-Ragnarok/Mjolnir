import { Request, Response } from 'express';
import { ApiKeyService } from '../services/ApiKeyService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const createApiKey = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { name, scopes } = req.body;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ message: 'Invalid: name is required and must be a string' });
  }

  let validScopes: string[] = scopes || ['read:tasks'];
  if (!Array.isArray(validScopes)) {
    return res.status(400).json({ message: 'Invalid: scopes must be an array' });
  }

  const result = await ApiKeyService.create(req.user._id.toString(), name, validScopes);
  res.status(201).json(result);
});

export const listApiKeys = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const keys = await ApiKeyService.listByUserId((req.user as any)._id.toString());
  res.json(keys);
});

export const revokeApiKey = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const id = req.params.id;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid: id is required' });
  }

  try {
    await ApiKeyService.revokeById((req.user as any)._id.toString(), id);
    res.json({ message: 'API key revoked successfully' });
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({ message: error.message });
    }
    throw error;
  }
});
