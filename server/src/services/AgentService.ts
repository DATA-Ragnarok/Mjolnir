import mongoose from 'mongoose';
import { UserStoryService } from './UserStoryService.js';
import { FeatureService } from './FeatureService.js';
import { EpicService } from './EpicService.js';
import { SprintService } from './SprintService.js';
import { UserService } from './UserService.js';
import { UserStoryStatus } from '../models/UserStory.js';
import { AppError } from '../middleware/errorHandler.js';

const ALLOWED_STATUSES: UserStoryStatus[] = ['To Do', 'In Progress', 'Blocked', 'Waiting for MR', 'Done'];

export interface ListUserStoriesQuery {
  assignedUser?: string;
  sprint?: string;
  featureId?: string;
  status?: string;
  limit?: string | number;
}

export interface CreateUserStoryDTO {
  title?: string;
  description?: string;
  storyPoints?: number;
  featureId?: string;
  sprintId?: string;
  assignedUserId?: string;
}

export class AgentService {
  static async listUserStories(query: ListUserStoriesQuery, currentUserId?: string) {
    const { assignedUser = 'me', sprint = 'active', featureId, status, limit = 50 } = query;
    const filter: any = {};

    if (assignedUser === 'me') {
      if (currentUserId && mongoose.Types.ObjectId.isValid(currentUserId)) {
        filter.assignedUser = new mongoose.Types.ObjectId(currentUserId);
      }
    } else if (assignedUser !== 'all' && typeof assignedUser === 'string' && mongoose.Types.ObjectId.isValid(assignedUser)) {
      filter.assignedUser = new mongoose.Types.ObjectId(assignedUser);
    }

    if (sprint === 'active') {
      const activeSprint = await SprintService.getActiveSprint();
      filter.sprintId = activeSprint ? activeSprint._id : null;
    } else if (sprint === 'backlog') {
      filter.sprintId = { $in: [null, undefined] };
    } else if (sprint !== 'all' && typeof sprint === 'string' && mongoose.Types.ObjectId.isValid(sprint)) {
      filter.sprintId = new mongoose.Types.ObjectId(sprint);
    }

    if (featureId && typeof featureId === 'string' && mongoose.Types.ObjectId.isValid(featureId)) {
      filter.featureId = new mongoose.Types.ObjectId(featureId);
    }

    if (status && typeof status === 'string' && ALLOWED_STATUSES.includes(status as UserStoryStatus)) {
      filter.status = status;
    }

    const parsedLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const stories = await UserStoryService.getAll(filter);
    return stories.slice(0, parsedLimit);
  }

  static async getUserStory(id: string) {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(400, 'Invalid user story ID');
    }
    const story = await UserStoryService.getById(id);
    if (!story) {
      throw new AppError(404, 'User story not found');
    }
    return story;
  }

  static async createUserStory(data: CreateUserStoryDTO, currentUserId?: string) {
    const { title, description, storyPoints, featureId, sprintId, assignedUserId } = data;

    if (!title || typeof title !== 'string' || !title.trim()) {
      throw new AppError(400, 'Title is required');
    }

    if (storyPoints === undefined || storyPoints === null || typeof storyPoints !== 'number' || isNaN(storyPoints)) {
      throw new AppError(400, 'Story points is mandatory and must be a number');
    }

    if (!featureId || !mongoose.Types.ObjectId.isValid(featureId)) {
      throw new AppError(400, 'Valid featureId is required');
    }

    const feature = await FeatureService.getById(featureId);
    if (!feature) {
      throw new AppError(404, 'Feature not found');
    }

    let validSprintId: any = undefined;
    if (sprintId) {
      if (!mongoose.Types.ObjectId.isValid(sprintId)) {
        throw new AppError(400, 'Invalid sprintId');
      }
      validSprintId = new mongoose.Types.ObjectId(sprintId);
    }

    let validAssignedUser: any = currentUserId ? new mongoose.Types.ObjectId(currentUserId) : undefined;
    if (assignedUserId) {
      if (!mongoose.Types.ObjectId.isValid(assignedUserId)) {
        throw new AppError(400, 'Invalid assignedUserId');
      }
      validAssignedUser = new mongoose.Types.ObjectId(assignedUserId);
    }

    return await UserStoryService.create({
      title: title.trim(),
      description: description?.trim() || '',
      storyPoints,
      featureId: new mongoose.Types.ObjectId(featureId) as any,
      sprintId: validSprintId,
      assignedUser: validAssignedUser,
      status: 'To Do'
    });
  }

  static async updateUserStoryStatus(id: string, body: any) {
    const { status, ...otherFields } = body || {};

    if (Object.keys(otherFields).length > 0) {
      throw new AppError(403, 'Least Privilege Policy: AI agents are only permitted to modify task status. Modifying title, description, storyPoints, or assignee is forbidden.');
    }

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(400, 'Invalid user story ID');
    }

    if (!status || !ALLOWED_STATUSES.includes(status as UserStoryStatus)) {
      throw new AppError(400, `Invalid status. Allowed statuses: ${ALLOWED_STATUSES.join(', ')}`);
    }

    const updated = await UserStoryService.update(id, { status });
    if (!updated) {
      throw new AppError(404, 'User story not found');
    }
    return updated;
  }

  static async listEpics() {
    return await EpicService.getAll();
  }

  static async listFeatures(epicId?: string) {
    const filter: any = {};
    if (epicId && typeof epicId === 'string' && mongoose.Types.ObjectId.isValid(epicId)) {
      filter.epicId = epicId;
    }
    return await FeatureService.getAll(filter);
  }

  static async listSprints() {
    return await SprintService.getAll();
  }

  static async listUsers() {
    return await UserService.getApprovedUsers();
  }
}
