import { Request, Response } from 'express';
import { FeatureService } from '../services/FeatureService.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

export const getAllFeatures = asyncHandler(async (req: Request, res: Response) => {
  const filters: any = {};
  if (req.query['epicId']) filters.epicId = req.query['epicId'];
  
  const features = await FeatureService.getAll(filters);
  res.json(features);
});

export const createFeature = asyncHandler(async (req: Request, res: Response) => {
  const feature = await FeatureService.create(req.body);
  res.status(201).json(feature);
});

export const updateFeature = asyncHandler(async (req: Request, res: Response) => {
  const feature = await FeatureService.update(req.params['id'] as string, req.body);
  if (!feature) throw new AppError(404, 'Feature not found');
  res.json(feature);
});

export const deleteFeature = asyncHandler(async (req: Request, res: Response) => {
  const feature = await FeatureService.delete(req.params['id'] as string);
  if (!feature) throw new AppError(404, 'Feature not found');
  res.json({ message: 'Feature deleted' });
});
