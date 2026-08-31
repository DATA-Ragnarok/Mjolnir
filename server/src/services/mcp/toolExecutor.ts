import mongoose from 'mongoose';
import { UserStoryService } from '../UserStoryService.js';
import { FeatureService } from '../FeatureService.js';
import { EpicService } from '../EpicService.js';
import { SprintService } from '../SprintService.js';
import { UserService } from '../UserService.js';
import { User as UserType } from '../../models/User.js';
import { UserStory as UserStoryType, UserStoryStatus } from '../../models/UserStory.js';
import { Feature as FeatureType } from '../../models/Feature.js';
import { Epic as EpicType } from '../../models/Epic.js';
import { Sprint as SprintType } from '../../models/Sprint.js';
import {
  UserStorySummaryDTO,
  UserStoryDetailDTO,
  FeatureSummaryDTO,
  EpicSummaryDTO,
  SprintSummaryDTO,
  TeamMemberDTO,
  UserProfileDTO
} from './types.js';

const toUserStorySummaryDTO = (s: UserStoryType): UserStorySummaryDTO => {
  let assigneeStr: string | undefined;
  if (s.assignedUser) {
    if (typeof s.assignedUser === 'object' && 'name' in s.assignedUser && s.assignedUser.name) {
      assigneeStr = s.assignedUser.name;
    } else {
      assigneeStr = String(s.assignedUser);
    }
  }

  return {
    _id: String(s._id),
    title: s.title,
    status: s.status,
    storyPoints: s.storyPoints,
    featureId: String(s.featureId),
    sprintId: s.sprintId ? String(s.sprintId) : undefined,
    assignedUser: assigneeStr
  };
};

const toUserStoryDetailDTO = (s: UserStoryType): UserStoryDetailDTO => ({
  _id: String(s._id),
  title: s.title,
  description: s.description || '',
  storyPoints: s.storyPoints,
  status: s.status,
  featureId: String(s.featureId),
  sprintId: s.sprintId ? String(s.sprintId) : undefined,
  assignedUser: s.assignedUser ? (typeof s.assignedUser === 'object' && 'name' in s.assignedUser ? {
    _id: String(s.assignedUser._id),
    name: s.assignedUser.name,
    email: s.assignedUser.email
  } : String(s.assignedUser)) : undefined
});

const toFeatureSummaryDTO = (f: FeatureType): FeatureSummaryDTO => ({
  _id: String(f._id),
  title: f.title,
  status: f.status,
  epicId: String(f.epicId)
});

const toEpicSummaryDTO = (e: EpicType): EpicSummaryDTO => ({
  _id: String(e._id),
  title: e.title,
  status: e.status
});

const toSprintSummaryDTO = (s: SprintType): SprintSummaryDTO => ({
  _id: String(s._id),
  name: s.name,
  startDate: s.startDate,
  endDate: s.endDate
});

const toTeamMemberDTO = (m: UserType): TeamMemberDTO => ({
  _id: String(m._id),
  name: m.name,
  email: m.email
});

const toUserProfileDTO = (u: UserType): UserProfileDTO => ({
  _id: String(u._id),
  name: u.name,
  email: u.email,
  isAdmin: u.isAdmin
});

export class McpToolExecutor {
  static async executeTool(name: string, args: Record<string, unknown> | undefined, user: UserType): Promise<unknown> {
    const safeArgs = args && typeof args === 'object' && !Array.isArray(args) ? args : {};

    switch (name) {
      case 'list_user_stories': {
        const assignedUser = typeof safeArgs['assignedUser'] === 'string' ? safeArgs['assignedUser'] : 'me';
        const sprint = typeof safeArgs['sprint'] === 'string' ? safeArgs['sprint'] : 'active';
        const featureId = typeof safeArgs['featureId'] === 'string' ? safeArgs['featureId'] : undefined;
        const status = typeof safeArgs['status'] === 'string' ? safeArgs['status'] : undefined;
        const limit = typeof safeArgs['limit'] === 'number' ? safeArgs['limit'] : 25;

        const filter: Record<string, unknown> = {};

        if (assignedUser === 'me') {
          if (user?._id) filter['assignedUser'] = user._id;
        } else if (assignedUser !== 'all' && mongoose.Types.ObjectId.isValid(assignedUser)) {
          filter['assignedUser'] = new mongoose.Types.ObjectId(assignedUser);
        }

        if (sprint === 'active') {
          const activeSprint = await SprintService.getActiveSprint();
          filter['sprintId'] = activeSprint ? activeSprint._id : null;
        } else if (sprint === 'backlog') {
          filter['sprintId'] = { $in: [null, undefined] };
        } else if (sprint !== 'all' && mongoose.Types.ObjectId.isValid(sprint)) {
          filter['sprintId'] = new mongoose.Types.ObjectId(sprint);
        }

        if (featureId && mongoose.Types.ObjectId.isValid(featureId)) {
          filter['featureId'] = new mongoose.Types.ObjectId(featureId);
        }

        if (status && ['To Do', 'In Progress', 'Blocked', 'Waiting for MR', 'Done'].includes(status)) {
          filter['status'] = status as UserStoryStatus;
        }

        const parsedLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);
        const stories = await UserStoryService.getAll(filter);
        const userStories = stories.slice(0, parsedLimit).map(toUserStorySummaryDTO);

        return {
          count: userStories.length,
          userStories
        };
      }

      case 'get_user_story': {
        const id = typeof safeArgs['id'] === 'string' ? safeArgs['id'] : undefined;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
          throw new Error('Valid user story ID is required');
        }
        const story = await UserStoryService.getById(id);
        if (!story) throw new Error('User story not found');
        return {
          userStory: toUserStoryDetailDTO(story)
        };
      }

      case 'create_user_story': {
        const title = typeof safeArgs['title'] === 'string' ? safeArgs['title'].trim() : '';
        const storyPoints = typeof safeArgs['storyPoints'] === 'number'
          ? safeArgs['storyPoints']
          : typeof safeArgs['story_points'] === 'number'
          ? safeArgs['story_points']
          : undefined;
        const featureId = typeof safeArgs['featureId'] === 'string'
          ? safeArgs['featureId']
          : typeof safeArgs['feature_id'] === 'string'
          ? safeArgs['feature_id']
          : undefined;
        const description = typeof safeArgs['description'] === 'string' ? safeArgs['description'].trim() : '';
        const sprintId = typeof safeArgs['sprintId'] === 'string'
          ? safeArgs['sprintId']
          : typeof safeArgs['sprint_id'] === 'string'
          ? safeArgs['sprint_id']
          : undefined;
        const assignedUserId = typeof safeArgs['assignedUserId'] === 'string'
          ? safeArgs['assignedUserId']
          : typeof safeArgs['assigned_user_id'] === 'string'
          ? safeArgs['assigned_user_id']
          : undefined;

        if (!title) throw new Error('Title is mandatory');
        if (storyPoints === undefined || isNaN(storyPoints)) throw new Error('Story points is mandatory and must be a number');
        if (!featureId || !mongoose.Types.ObjectId.isValid(featureId)) throw new Error('Valid featureId is mandatory');

        const feature = await FeatureService.getById(featureId);
        if (!feature) throw new Error('Feature not found');

        let validSprintId: mongoose.Types.ObjectId | undefined = undefined;
        if (sprintId) {
          if (!mongoose.Types.ObjectId.isValid(sprintId)) throw new Error('Invalid sprintId');
          validSprintId = new mongoose.Types.ObjectId(sprintId);
        }

        let validAssignedUser: mongoose.Types.ObjectId | undefined = user?._id;
        if (assignedUserId) {
          if (!mongoose.Types.ObjectId.isValid(assignedUserId)) throw new Error('Invalid assignedUserId');
          validAssignedUser = new mongoose.Types.ObjectId(assignedUserId);
        }

        const created = await UserStoryService.create({
          title,
          description,
          storyPoints,
          featureId: new mongoose.Types.ObjectId(featureId),
          sprintId: validSprintId,
          assignedUser: validAssignedUser,
          status: 'To Do'
        });

        return {
          message: 'User story created successfully',
          userStory: toUserStoryDetailDTO(created)
        };
      }

      case 'update_user_story_status': {
        const id = typeof safeArgs['id'] === 'string' ? safeArgs['id'] : undefined;
        const status = typeof safeArgs['status'] === 'string' ? safeArgs['status'] : undefined;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) throw new Error('Valid user story ID is required');
        if (!status || !['To Do', 'In Progress', 'Blocked', 'Waiting for MR', 'Done'].includes(status)) {
          throw new Error('Valid status is required ("To Do", "In Progress", "Blocked", "Waiting for MR", "Done")');
        }

        const updated = await UserStoryService.update(id, { status: status as UserStoryStatus });
        if (!updated) throw new Error('User story not found');
        return {
          message: 'User story status updated successfully',
          userStory: toUserStoryDetailDTO(updated)
        };
      }

      case 'list_features': {
        const epicId = typeof safeArgs['epicId'] === 'string' ? safeArgs['epicId'] : undefined;
        const filter: Record<string, unknown> = {};
        if (epicId && mongoose.Types.ObjectId.isValid(epicId)) {
          filter['epicId'] = new mongoose.Types.ObjectId(epicId);
        }
        const features = await FeatureService.getAll(filter);
        const leanFeatures = features.map(toFeatureSummaryDTO);
        return {
          count: leanFeatures.length,
          features: leanFeatures
        };
      }

      case 'list_epics': {
        const epics = await EpicService.getAll();
        const leanEpics = epics.map(toEpicSummaryDTO);
        return {
          count: leanEpics.length,
          epics: leanEpics
        };
      }

      case 'get_active_sprint': {
        const activeSprint = await SprintService.getActiveSprint();
        return {
          activeSprint: activeSprint ? toSprintSummaryDTO(activeSprint) : null
        };
      }

      case 'list_team_members': {
        const members = await UserService.getApprovedUsers();
        const leanMembers = members.map(toTeamMemberDTO);
        return {
          count: leanMembers.length,
          members: leanMembers
        };
      }

      case 'get_current_user': {
        return {
          user: toUserProfileDTO(user)
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
}
