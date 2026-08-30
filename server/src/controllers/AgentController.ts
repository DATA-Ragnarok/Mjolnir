import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { UserStoryService } from '../services/UserStoryService.js';
import { FeatureService } from '../services/FeatureService.js';
import { EpicService } from '../services/EpicService.js';
import { SprintService } from '../services/SprintService.js';
import { UserService } from '../services/UserService.js';
import { UserStoryStatus } from '../models/UserStory.js';

const ALLOWED_STATUSES: UserStoryStatus[] = ['To Do', 'In Progress', 'Blocked', 'Waiting for MR', 'Done'];

export class AgentController {
  // GET /api/agent/us
  static async listUserStories(req: Request, res: Response) {
    try {
      const { assignedUser = 'me', sprint = 'active', featureId, status, limit = 50 } = req.query;
      const filter: any = {};

      // Handle assignedUser filter (default 'me')
      if (assignedUser === 'me') {
        if (req.user?._id) {
          filter.assignedUser = req.user._id;
        }
      } else if (assignedUser === 'all') {
        // No filter on assignedUser
      } else if (typeof assignedUser === 'string' && mongoose.Types.ObjectId.isValid(assignedUser)) {
        filter.assignedUser = new mongoose.Types.ObjectId(assignedUser);
      }

      // Handle sprint filter (default 'active')
      if (sprint === 'active') {
        const activeSprint = await SprintService.getActiveSprint();
        if (activeSprint) {
          filter.sprintId = activeSprint._id;
        } else {
          // If no active sprint, return empty or non-sprinted stories
          filter.sprintId = null;
        }
      } else if (sprint === 'backlog') {
        filter.sprintId = { $in: [null, undefined] };
      } else if (sprint === 'all') {
        // No filter on sprint
      } else if (typeof sprint === 'string' && mongoose.Types.ObjectId.isValid(sprint)) {
        filter.sprintId = new mongoose.Types.ObjectId(sprint);
      }

      // Handle featureId filter
      if (featureId && typeof featureId === 'string' && mongoose.Types.ObjectId.isValid(featureId)) {
        filter.featureId = new mongoose.Types.ObjectId(featureId);
      }

      // Handle status filter
      if (status && typeof status === 'string' && ALLOWED_STATUSES.includes(status as UserStoryStatus)) {
        filter.status = status;
      }

      const parsedLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
      const stories = await UserStoryService.getAll(filter);
      const limitedStories = stories.slice(0, parsedLimit);

      res.json(limitedStories);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch user stories' });
    }
  }

  // GET /api/agent/us/:id
  static async getUserStory(req: Request, res: Response) {
    try {
      const id = req.params['id'] as string;
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid user story ID' });
      }

      const story = await UserStoryService.getById(id);
      if (!story) {
        return res.status(404).json({ message: 'User story not found' });
      }

      res.json(story);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch user story' });
    }
  }

  // POST /api/agent/us
  static async createUserStory(req: Request, res: Response) {
    try {
      const { title, description, storyPoints, featureId, sprintId, assignedUserId } = req.body;

      if (!title || typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ message: 'Title is required' });
      }

      if (storyPoints === undefined || storyPoints === null || typeof storyPoints !== 'number' || isNaN(storyPoints)) {
        return res.status(400).json({ message: 'Story points is mandatory and must be a number' });
      }

      if (!featureId || !mongoose.Types.ObjectId.isValid(featureId)) {
        return res.status(400).json({ message: 'Valid featureId is required' });
      }

      const feature = await FeatureService.getById(featureId);
      if (!feature) {
        return res.status(404).json({ message: 'Feature not found' });
      }

      let validSprintId: any = undefined;
      if (sprintId) {
        if (!mongoose.Types.ObjectId.isValid(sprintId)) {
          return res.status(400).json({ message: 'Invalid sprintId' });
        }
        validSprintId = new mongoose.Types.ObjectId(sprintId);
      }

      let validAssignedUser: any = req.user?._id;
      if (assignedUserId) {
        if (!mongoose.Types.ObjectId.isValid(assignedUserId)) {
          return res.status(400).json({ message: 'Invalid assignedUserId' });
        }
        validAssignedUser = new mongoose.Types.ObjectId(assignedUserId);
      }

      const newStory = await UserStoryService.create({
        title: title.trim(),
        description: description?.trim() || '',
        storyPoints,
        featureId: new mongoose.Types.ObjectId(featureId) as any,
        sprintId: validSprintId,
        assignedUser: validAssignedUser,
        status: 'To Do'
      });

      res.status(201).json(newStory);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to create user story' });
    }
  }

  // PATCH /api/agent/us/:id/status
  static async updateUserStoryStatus(req: Request, res: Response) {
    try {
      const id = req.params['id'] as string;
      const { status, ...otherFields } = req.body;

      if (Object.keys(otherFields).length > 0) {
        return res.status(403).json({
          message: 'Least Privilege Policy: AI agents are only permitted to modify task status. Modifying title, description, storyPoints, or assignee is forbidden.'
        });
      }

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid user story ID' });
      }

      if (!status || !ALLOWED_STATUSES.includes(status as UserStoryStatus)) {
        return res.status(400).json({
          message: `Invalid status. Allowed statuses: ${ALLOWED_STATUSES.join(', ')}`
        });
      }

      const updated = await UserStoryService.update(id, { status });
      if (!updated) {
        return res.status(404).json({ message: 'User story not found' });
      }

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to update user story status' });
    }
  }

  // Method Not Allowed handler for forbidden operations
  static methodNotAllowed(req: Request, res: Response) {
    res.status(405).json({
      message: 'Method Not Allowed: AI agents cannot delete or perform unauthorized full updates on user stories.'
    });
  }

  // GET /api/agent/epic
  static async listEpics(req: Request, res: Response) {
    try {
      const epics = await EpicService.getAll();
      res.json(epics);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch epics' });
    }
  }

  // GET /api/agent/feature
  static async listFeatures(req: Request, res: Response) {
    try {
      const { epicId } = req.query;
      const filter: any = {};
      if (epicId && typeof epicId === 'string' && mongoose.Types.ObjectId.isValid(epicId)) {
        filter.epicId = epicId;
      }
      const features = await FeatureService.getAll(filter);
      res.json(features);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch features' });
    }
  }

  // GET /api/agent/sprints
  static async listSprints(req: Request, res: Response) {
    try {
      const sprints = await SprintService.getAll();
      res.json(sprints);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch sprints' });
    }
  }

  // GET /api/agent/users
  static async listUsers(req: Request, res: Response) {
    try {
      const users = await UserService.getApprovedUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch users' });
    }
  }

  // GET /api/agent/me
  static async getCurrentUser(req: Request, res: Response) {
    try {
      res.json(req.user);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch profile' });
    }
  }
}
