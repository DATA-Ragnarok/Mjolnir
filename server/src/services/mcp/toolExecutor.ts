import mongoose from 'mongoose';
import { UserStoryService } from '../UserStoryService.js';
import { FeatureService } from '../FeatureService.js';
import { EpicService } from '../EpicService.js';
import { SprintService } from '../SprintService.js';
import { UserService } from '../UserService.js';
import { User as UserType } from '../../models/User.js';
import { UserStoryStatus } from '../../models/UserStory.js';
import {
  UserStorySummaryDTO,
  UserStoryDetailDTO,
  FeatureSummaryDTO,
  EpicSummaryDTO,
  SprintSummaryDTO,
  TeamMemberDTO,
  UserProfileDTO
} from './types.js';

const toUserStorySummaryDTO = (s: any): UserStorySummaryDTO => ({
  _id: s._id,
  title: s.title,
  status: s.status,
  storyPoints: s.storyPoints,
  featureId: s.featureId,
  sprintId: s.sprintId || undefined,
  assignedUser: s.assignedUser ? (typeof s.assignedUser === 'object' && s.assignedUser.name ? s.assignedUser.name : s.assignedUser) : undefined
});

const toUserStoryDetailDTO = (s: any): UserStoryDetailDTO => ({
  _id: s._id,
  title: s.title,
  description: s.description || '',
  storyPoints: s.storyPoints,
  status: s.status,
  featureId: s.featureId,
  sprintId: s.sprintId,
  assignedUser: s.assignedUser
});

const toFeatureSummaryDTO = (f: any): FeatureSummaryDTO => ({
  _id: f._id,
  title: f.title,
  status: f.status,
  epicId: f.epicId
});

const toEpicSummaryDTO = (e: any): EpicSummaryDTO => ({
  _id: e._id,
  title: e.title,
  status: e.status
});

const toSprintSummaryDTO = (s: any): SprintSummaryDTO => ({
  _id: s._id,
  name: s.name,
  startDate: s.startDate,
  endDate: s.endDate
});

const toTeamMemberDTO = (m: any): TeamMemberDTO => ({
  _id: m._id,
  name: m.name,
  email: m.email
});

const toUserProfileDTO = (u: any): UserProfileDTO => ({
  _id: u._id,
  name: u.name,
  email: u.email,
  isAdmin: u.isAdmin
});

export class McpToolExecutor {
  static async executeTool(name: string, args: any, user: UserType): Promise<any> {
    const safeArgs = args && typeof args === 'object' && !Array.isArray(args) ? args : {};

    switch (name) {
      case 'list_user_stories': {
        const { assignedUser = 'me', sprint = 'active', featureId, status, limit = 25 } = safeArgs;
        const filter: any = {};

        if (assignedUser === 'me') {
          if (user?._id) filter.assignedUser = user._id;
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

        if (status && ['To Do', 'In Progress', 'Blocked', 'Waiting for MR', 'Done'].includes(status)) {
          filter.status = status;
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
        const { id } = safeArgs;
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
        const { title, description, story_points, storyPoints, feature_id, featureId, sprint_id, sprintId, assigned_user_id, assignedUserId } = safeArgs;
        const effectiveTitle = title?.trim();
        const effectivePoints = story_points ?? storyPoints;
        const effectiveFeatureId = feature_id ?? featureId;
        const effectiveSprintId = sprint_id ?? sprintId;
        const effectiveAssigneeId = assigned_user_id ?? assignedUserId;

        if (!effectiveTitle) throw new Error('Title is mandatory');
        if (effectivePoints === undefined || typeof effectivePoints !== 'number') throw new Error('Story points is mandatory and must be a number');
        if (!effectiveFeatureId || !mongoose.Types.ObjectId.isValid(effectiveFeatureId)) throw new Error('Valid featureId is mandatory');

        const feature = await FeatureService.getById(effectiveFeatureId);
        if (!feature) throw new Error('Feature not found');

        let validSprintId: any = undefined;
        if (effectiveSprintId) {
          if (!mongoose.Types.ObjectId.isValid(effectiveSprintId)) throw new Error('Invalid sprintId');
          validSprintId = new mongoose.Types.ObjectId(effectiveSprintId);
        }

        let validAssignedUser: any = user?._id;
        if (effectiveAssigneeId) {
          if (!mongoose.Types.ObjectId.isValid(effectiveAssigneeId)) throw new Error('Invalid assignedUserId');
          validAssignedUser = new mongoose.Types.ObjectId(effectiveAssigneeId);
        }

        const created = await UserStoryService.create({
          title: effectiveTitle,
          description: description?.trim() || '',
          storyPoints: effectivePoints,
          featureId: new mongoose.Types.ObjectId(effectiveFeatureId) as any,
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
        const { id, status } = safeArgs;
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
        const { epicId } = safeArgs;
        const filter: any = {};
        if (epicId && typeof epicId === 'string' && mongoose.Types.ObjectId.isValid(epicId)) {
          filter.epicId = epicId;
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
