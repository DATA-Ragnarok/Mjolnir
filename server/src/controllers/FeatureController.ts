import { Request, Response } from 'express';
import { FeatureService } from '../services/FeatureService.js';

export const getAllFeatures = async (req: Request, res: Response) => {
  try {
    const filters: any = {};
    if (req.query['epicId']) filters.epicId = req.query['epicId'];
    
    const features = await FeatureService.getAll(filters);
    res.json(features);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching features', error });
  }
};

export const createFeature = async (req: Request, res: Response) => {
  try {
    const feature = await FeatureService.create(req.body);
    res.status(201).json(feature);
  } catch (error) {
    res.status(400).json({ message: 'Error creating feature', error });
  }
};

export const updateFeature = async (req: Request, res: Response) => {
  try {
    const feature = await FeatureService.update(req.params['id'] as string, req.body);
    if (!feature) return res.status(404).json({ message: 'Feature not found' });
    res.json(feature);
  } catch (error) {
    res.status(400).json({ message: 'Error updating feature', error });
  }
};

export const deleteFeature = async (req: Request, res: Response) => {
  try {
    const feature = await FeatureService.delete(req.params['id'] as string);
    if (!feature) return res.status(404).json({ message: 'Feature not found' });
    res.json({ message: 'Feature deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting feature', error });
  }
};
