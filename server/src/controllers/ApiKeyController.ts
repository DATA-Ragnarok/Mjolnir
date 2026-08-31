import { Request, Response } from 'express';
import { ApiKeyService } from '../services/ApiKeyService.js';
import { ApiKey as ApiKeyType } from '../models/ApiKey.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

const apiKeyToDTO = (apiKey: ApiKeyType) => ({
  key: apiKey.key,
  name: apiKey.name,
  createdAt: apiKey.createdAt,
  lastUsedAt: apiKey.lastUsedAt
});

export const getApiKey = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, 'Unauthorized');

  const apiKey = await ApiKeyService.getApiKeyForUser(req.user._id.toString());
  res.json({ apiKey: apiKey ? apiKeyToDTO(apiKey) : null });
});

export const generateApiKey = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, 'Unauthorized');

  const name = typeof req.body?.name === 'string' ? req.body.name : 'Agent Integration Key';
  const apiKey = await ApiKeyService.createOrRegenerateApiKey(req.user._id.toString(), name);

  res.status(201).json({ apiKey: apiKeyToDTO(apiKey) });
});
