import { Request, Response } from 'express';
import { UserStoryDAL } from '../dal/UserStoryDAL.js';
import { FeatureDAL } from '../dal/FeatureDAL.js';
import { SprintService } from '../services/SprintService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const listUserStories = asyncHandler(async (req: Request, res: Response) => {
  if (!req.apiKey) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { status, limit = 50, sortBy = 'createdAt' } = req.query;

  const query: any = {};
  if (status && typeof status === 'string') {
    query.status = status;
  }

  const numLimit = Math.min(parseInt(limit as string) || 50, 500);
  const sortField = (sortBy as string) || 'createdAt';
  
  const stories = await UserStoryDAL.find(
    query,
    {
      _id: 1,
      title: 1,
      description: 1,
      status: 1,
      storyPoints: 1,
      createdAt: 1,
      tags: 1,
      priority: 1,
    },
    {
      limit: numLimit,
      sort: { [sortField]: -1 },
    }
  );

  const sanitized = stories.map((story: any) => ({
    _id: story._id,
    title: story.title,
    description: story.description,
    status: story.status,
    storyPoints: story.storyPoints,
    priority: story.priority,
    tags: story.tags,
    createdAt: story.createdAt,
  }));

  res.json(sanitized);
});

export const createUserStory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.apiKey) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { title, description, storyPoints, featureId } = req.body;

  // Validate required fields
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ message: 'Invalid: title is required and must be a string' });
  }

  if (!featureId || typeof featureId !== 'string') {
    return res.status(400).json({ message: 'Invalid: featureId is required and must be a string' });
  }

  if (!storyPoints || ![1, 3, 5, 8, 666].includes(Number(storyPoints))) {
    return res
      .status(400)
      .json({ message: 'Invalid: storyPoints must be 1, 3, 5, 8, or 666' });
  }

  // Verify feature exists
  const feature = await FeatureDAL.findById(featureId);
  if (!feature) {
    return res.status(404).json({ message: 'Feature not found' });
  }

  // Get current sprint
  const currentSprint = await SprintService.getCurrentSprint();
  if (!currentSprint) {
    return res.status(400).json({ message: 'No active sprint available' });
  }

  const newStory = await UserStoryDAL.create({
    title,
    description: description || '',
    status: 'To Do',
    storyPoints: Number(storyPoints),
    featureId: featureId as any,
    sprintId: currentSprint._id as any,
    assignedUser: req.apiKey.createdByUserId as any,
  });

  const populated = await newStory.populate('featureId sprintId assignedUser');

  res.status(201).json({
    _id: (populated as any)._id,
    title: (populated as any).title,
    description: (populated as any).description,
    status: (populated as any).status,
    storyPoints: (populated as any).storyPoints,
    createdAt: (populated as any).createdAt,
  });
});

export const listFeatures = asyncHandler(async (req: Request, res: Response) => {
  if (!req.apiKey) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const features = await (FeatureDAL as any).find({}, {
    _id: 1,
    title: 1,
    description: 1,
    status: 1,
  });

  const sanitized = features.map((feature: any) => ({
    _id: feature._id,
    title: feature.title,
    description: feature.description,
    status: feature.status,
  }));

  res.json(sanitized);
});
