import { Request, Response } from 'express';
import { AgentService } from '../services/AgentService.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

export const listUserStories = asyncHandler(async (req: Request, res: Response) => {
  const stories = await AgentService.listUserStories(req.query, req.user?._id?.toString());
  res.json(stories);
});

export const getUserStory = asyncHandler(async (req: Request, res: Response) => {
  const story = await AgentService.getUserStory(req.params['id'] as string);
  res.json(story);
});

export const createUserStory = asyncHandler(async (req: Request, res: Response) => {
  const newStory = await AgentService.createUserStory(req.body, req.user?._id?.toString());
  res.status(201).json(newStory);
});

export const updateUserStoryStatus = asyncHandler(async (req: Request, res: Response) => {
  const updated = await AgentService.updateUserStoryStatus(req.params['id'] as string, req.body);
  res.json(updated);
});

export const listEpics = asyncHandler(async (_req: Request, res: Response) => {
  const epics = await AgentService.listEpics();
  res.json(epics);
});

export const listFeatures = asyncHandler(async (req: Request, res: Response) => {
  const features = await AgentService.listFeatures(req.query['epicId'] as string | undefined);
  res.json(features);
});

export const listSprints = asyncHandler(async (_req: Request, res: Response) => {
  const sprints = await AgentService.listSprints();
  res.json(sprints);
});

export const listUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await AgentService.listUsers();
  res.json(users);
});

export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  res.json(req.user);
});

export const methodNotAllowed = asyncHandler(async (_req: Request, res: Response) => {
  throw new AppError(405, 'Method Not Allowed: AI agents cannot delete or perform unauthorized full updates on user stories.');
});
