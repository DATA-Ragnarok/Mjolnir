import { Request, Response } from 'express';
import { UserStoryService } from '../services/UserStoryService.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

export const getAllUserStories = asyncHandler(async (req: Request, res: Response) => {
  const filters: any = {};
  if (req.query['featureId']) filters.featureId = req.query['featureId'];
  if (req.query['sprintId']) filters.sprintId = req.query['sprintId'] === 'null' ? null : req.query['sprintId'];
  
  const stories = await UserStoryService.getAll(filters);
  res.json(stories);
});

export const createUserStory = asyncHandler(async (req: Request, res: Response) => {
  const story = await UserStoryService.create(req.body);
  res.status(201).json(story);
});

export const updateUserStory = asyncHandler(async (req: Request, res: Response) => {
  const story = await UserStoryService.update(req.params['id'] as string, req.body);
  if (!story) throw new AppError(404, 'User story not found');
  res.json(story);
});

export const deleteUserStory = asyncHandler(async (req: Request, res: Response) => {
  const story = await UserStoryService.delete(req.params['id'] as string);
  if (!story) throw new AppError(404, 'User story not found');
  res.json({ message: 'User story deleted' });
});
