import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { UserStoryDAL } from '../dal/UserStoryDAL.js';
import { FeatureDAL } from '../dal/FeatureDAL.js';
import { EpicDAL } from '../dal/EpicDAL.js';
import { SprintService } from '../services/SprintService.js';
import { UserStoryService } from '../services/UserStoryService.js';
import UserStory, { UserStoryStatus } from '../models/UserStory.js';
import User from '../models/User.js';
import Sprint from '../models/Sprint.js';
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

  const { status, limit = 50, sortBy = 'createdAt', sprintId, sprint, assignedUser, featureId } = req.query;

  const query: any = {};
  if (status && typeof status === 'string') {
    query.status = status;
  }
  if (featureId && typeof featureId === 'string') {
    query.featureId = featureId;
  }
  if (sprintId && typeof sprintId === 'string') {
    query.sprintId = sprintId;
  } else if (sprint && typeof sprint === 'string') {
    const sprintVal = sprint.trim();
    if (mongoose.Types.ObjectId.isValid(sprintVal)) {
      query.sprintId = sprintVal;
    } else {
      const matchingSprints = await Sprint.find({
        name: { $regex: sprintVal, $options: 'i' },
      });
      const sprintIds = matchingSprints.map((s) => s._id);
      query.sprintId = { $in: sprintIds };
    }
  }

  if (assignedUser && typeof assignedUser === 'string') {
    const userVal = assignedUser.trim();
    if (userVal.toLowerCase() === 'me') {
      query.assignedUser = req.apiKey.createdByUserId;
    } else if (mongoose.Types.ObjectId.isValid(userVal)) {
      query.assignedUser = userVal;
    } else {
      const matchingUsers = await User.find({
        $or: [
          { name: { $regex: userVal, $options: 'i' } },
          { email: { $regex: userVal, $options: 'i' } },
        ],
      });
      const userIds = matchingUsers.map((u) => u._id);
      query.assignedUser = { $in: userIds };
    }
  }

  const numLimit = Math.min(parseInt(limit as string) || 50, 500);
  const sortField = (sortBy as string) || 'createdAt';

  const stories = await UserStory.find(query)
    .populate('assignedUser')
    .populate('sprintId')
    .populate('featureId')
    .limit(numLimit)
    .sort({ [sortField]: -1 });

  const sanitized = stories.map((story: any) => ({
    _id: story._id,
    title: story.title,
    description: story.description,
    status: story.status,
    storyPoints: story.storyPoints,
    priority: story.priority,
    tags: story.tags,
    assignedUser: story.assignedUser
      ? {
          _id: story.assignedUser._id,
          name: story.assignedUser.name,
          email: story.assignedUser.email,
        }
      : null,
    sprint:
      story.sprintId && typeof story.sprintId === 'object'
        ? {
            _id: story.sprintId._id,
            name: story.sprintId.name,
            startDate: story.sprintId.startDate,
            endDate: story.sprintId.endDate,
          }
        : null,
    sprintId: story.sprintId?._id || story.sprintId || null,
    feature:
      story.featureId && typeof story.featureId === 'object'
        ? {
            _id: story.featureId._id,
            title: story.featureId.title,
          }
        : null,
    featureId: story.featureId?._id || story.featureId || null,
    createdAt: story.createdAt,
    updatedAt: story.updatedAt,
  }));

  res.json(sanitized);
});

export const createUserStory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.apiKey) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { title, description, storyPoints, featureId, assignedUserId } = req.body;

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
    assignedUser: (assignedUserId || req.apiKey.createdByUserId) as any,
  });

  const populated = await UserStory.findById(newStory._id)
    .populate('assignedUser')
    .populate('sprintId')
    .populate('featureId');

  res.status(201).json({
    _id: (populated as any)._id,
    title: (populated as any).title,
    description: (populated as any).description,
    status: (populated as any).status,
    storyPoints: (populated as any).storyPoints,
    assignedUser: (populated as any).assignedUser
      ? {
          _id: (populated as any).assignedUser._id,
          name: (populated as any).assignedUser.name,
          email: (populated as any).assignedUser.email,
        }
      : null,
    sprint: (populated as any).sprintId
      ? {
          _id: (populated as any).sprintId._id,
          name: (populated as any).sprintId.name,
          startDate: (populated as any).sprintId.startDate,
          endDate: (populated as any).sprintId.endDate,
        }
      : null,
    sprintId: (populated as any).sprintId?._id || (populated as any).sprintId || null,
    feature: (populated as any).featureId
      ? {
          _id: (populated as any).featureId._id,
          title: (populated as any).featureId.title,
        }
      : null,
    featureId: (populated as any).featureId?._id || (populated as any).featureId || null,
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

  const populated = await UserStory.findById(updatedStory._id)
    .populate('assignedUser')
    .populate('sprintId')
    .populate('featureId');

  res.json({
    _id: (populated as any)._id,
    title: (populated as any).title,
    description: (populated as any).description,
    status: (populated as any).status,
    storyPoints: (populated as any).storyPoints,
    assignedUser: (populated as any).assignedUser
      ? {
          _id: (populated as any).assignedUser._id,
          name: (populated as any).assignedUser.name,
          email: (populated as any).assignedUser.email,
        }
      : null,
    sprint: (populated as any).sprintId
      ? {
          _id: (populated as any).sprintId._id,
          name: (populated as any).sprintId.name,
          startDate: (populated as any).sprintId.startDate,
          endDate: (populated as any).sprintId.endDate,
        }
      : null,
    sprintId: (populated as any).sprintId?._id || (populated as any).sprintId || null,
    feature: (populated as any).featureId
      ? {
          _id: (populated as any).featureId._id,
          title: (populated as any).featureId.title,
        }
      : null,
    featureId: (populated as any).featureId?._id || (populated as any).featureId || null,
    updatedAt: (populated as any).updatedAt,
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

export const listSprints = asyncHandler(async (req: Request, res: Response) => {
  if (!req.apiKey) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const sprints = await Sprint.find().sort({ startDate: -1 });
  const sanitized = sprints.map((s: any) => ({
    _id: s._id,
    name: s.name,
    startDate: s.startDate,
    endDate: s.endDate,
    createdAt: s.createdAt,
  }));

  res.json(sanitized);
});

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  if (!req.apiKey) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const users = await User.find({ isApproved: true }, { _id: 1, name: 1, email: 1, isAdmin: 1 });
  const sanitized = users.map((u: any) => ({
    _id: u._id,
    name: u.name,
    email: u.email,
    isAdmin: u.isAdmin,
  }));

  res.json(sanitized);
});

export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.apiKey) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const user = await User.findById(req.apiKey.createdByUserId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
    isApproved: user.isApproved,
  });
});
