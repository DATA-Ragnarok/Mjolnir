import { Request, Response } from 'express';
import { UserStoryDAL } from '../dal/UserStoryDAL.js';
import { FeatureDAL } from '../dal/FeatureDAL.js';
import { EpicDAL } from '../dal/EpicDAL.js';
import { SprintService } from '../services/SprintService.js';
import { UserStoryService } from '../services/UserStoryService.js';
import { UserStoryStatus } from '../models/UserStory.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const listEpics = asyncHandler(async (req: Request, res: Response) => {
  if (!req.apiKey) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const epics = await EpicDAL.find(
    {},
    {
      _id: 1,
      title: 1,
      description: 1,
      status: 1,
      createdAt: 1,
      updatedAt: 1,
    }
  );

  const sanitized = epics.map((epic: any) => ({
    _id: epic._id,
    title: epic.title,
    description: epic.description,
    status: epic.status,
    createdAt: epic.createdAt,
    updatedAt: epic.updatedAt,
  }));

  res.json(sanitized);
});

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
      assignedUser: 1,
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
    assignedUser: story.assignedUser,
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

export const updateUserStoryStatus = asyncHandler(async (req: Request, res: Response) => {
  if (!req.apiKey) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { id } = req.params;
  const { status } = req.body;

  const validStatuses: UserStoryStatus[] = [
    'To Do',
    'In Progress',
    'Blocked',
    'Waiting for MR',
    'Done',
  ];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      message: `Invalid: status must be one of: ${validStatuses.join(', ')}`,
    });
  }

  const updatedStory = await UserStoryService.update(id as string, { status });
  if (!updatedStory) {
    return res.status(404).json({ message: 'User story not found' });
  }

  res.json({
    _id: (updatedStory as any)._id,
    title: (updatedStory as any).title,
    description: (updatedStory as any).description,
    status: (updatedStory as any).status,
    storyPoints: (updatedStory as any).storyPoints,
    updatedAt: (updatedStory as any).updatedAt,
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
