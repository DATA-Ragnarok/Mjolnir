import crypto from 'crypto';
import { Response } from 'express';
import mongoose from 'mongoose';
import { UserStoryService } from './UserStoryService.js';
import { FeatureService } from './FeatureService.js';
import { EpicService } from './EpicService.js';
import { SprintService } from './SprintService.js';
import { UserService } from './UserService.js';
import { User as UserType } from '../models/User.js';
import { UserStoryStatus } from '../models/UserStory.js';

interface McpSession {
  sessionId: string;
  res: Response;
  user: UserType;
  createdAt: Date;
}

const sessions = new Map<string, McpSession>();

const MCP_TOOLS = [
  {
    name: 'mjolnir_list_user_stories',
    description: 'Lists user stories (default: assigned to current user in active sprint).',
    inputSchema: {
      type: 'object',
      properties: {
        assignedUser: { type: 'string', description: "'me' (default), 'all', or userId" },
        sprint: { type: 'string', description: "'active' (default), 'all', 'backlog', or sprintId" },
        featureId: { type: 'string', description: 'Filter by parent feature ID' },
        status: { type: 'string', enum: ['To Do', 'In Progress', 'Blocked', 'Waiting for MR', 'Done'] },
        limit: { type: 'number', description: 'Max stories to return (default 25)' }
      }
    }
  },
  {
    name: 'mjolnir_get_user_story',
    description: 'Get full details and description of a single user story by ID.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'User story ID' }
      },
      required: ['id']
    }
  },
  {
    name: 'mjolnir_create_user_story',
    description: 'Creates a user story (mandatory: title, storyPoints, featureId).',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Story title' },
        storyPoints: { type: 'number', description: 'Mandatory story point estimation' },
        featureId: { type: 'string', description: 'Parent feature ID' },
        description: { type: 'string', description: 'Optional story description' },
        sprintId: { type: 'string', description: 'Optional sprint ID' },
        assignedUserId: { type: 'string', description: 'Optional assignee user ID' }
      },
      required: ['title', 'storyPoints', 'featureId']
    }
  },
  {
    name: 'mjolnir_update_user_story_status',
    description: 'Updates status of a story and triggers status inheritance.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'User story ID' },
        status: { type: 'string', enum: ['To Do', 'In Progress', 'Blocked', 'Waiting for MR', 'Done'] }
      },
      required: ['id', 'status']
    }
  },
  {
    name: 'mjolnir_list_features',
    description: 'Lists features to locate valid featureId.',
    inputSchema: {
      type: 'object',
      properties: {
        epicId: { type: 'string', description: 'Optional parent epic ID filter' }
      }
    }
  },
  {
    name: 'mjolnir_list_epics',
    description: 'Lists all epics.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'mjolnir_get_active_sprint',
    description: 'Gets the currently active sprint.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'mjolnir_list_team_members',
    description: 'Lists approved users for story assignment.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'mjolnir_get_current_user',
    description: 'Gets authenticated user profile.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];

export class McpServerService {
  static createSession(res: Response, user: UserType): string {
    const sessionId = crypto.randomUUID();
    sessions.set(sessionId, {
      sessionId,
      res,
      user,
      createdAt: new Date()
    });
    return sessionId;
  }

  static getSession(sessionId: string): McpSession | undefined {
    return sessions.get(sessionId);
  }

  static removeSession(sessionId: string) {
    sessions.delete(sessionId);
  }

  static sendSseEvent(sessionId: string, event: string, data: any) {
    const session = sessions.get(sessionId);
    if (session && !session.res.writableEnded) {
      session.res.write(`event: ${event}\ndata: ${typeof data === 'string' ? data : JSON.stringify(data)}\n\n`);
    }
  }

  static async handleJsonRpc(message: any, user: UserType, sessionId?: string): Promise<any> {
    const { jsonrpc, id, method, params } = message || {};

    if (!jsonrpc || jsonrpc !== '2.0') {
      return {
        jsonrpc: '2.0',
        id: id ?? null,
        error: { code: -32600, message: 'Invalid Request: jsonrpc must be "2.0"' }
      };
    }

    try {
      switch (method) {
        case 'initialize': {
          return {
            jsonrpc: '2.0',
            id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {}
              },
              serverInfo: {
                name: 'mjolnir-mcp-server',
                version: '1.0.0'
              }
            }
          };
        }

        case 'notifications/initialized': {
          // Notification, no response required
          return null;
        }

        case 'ping': {
          return {
            jsonrpc: '2.0',
            id,
            result: {}
          };
        }

        case 'tools/list': {
          return {
            jsonrpc: '2.0',
            id,
            result: {
              tools: MCP_TOOLS
            }
          };
        }

        case 'tools/call': {
          const { name, arguments: toolArgs = {} } = params || {};
          const toolResult = await this.executeTool(name, toolArgs, user);
          return {
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                {
                  type: 'text',
                  text: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult)
                }
              ],
              isError: false
            }
          };
        }

        default: {
          return {
            jsonrpc: '2.0',
            id,
            error: { code: -32601, message: `Method not found: ${method}` }
          };
        }
      }
    } catch (error: any) {
      if (method === 'tools/call') {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: error.message || 'Error executing tool'
              }
            ],
            isError: true
          }
        };
      }

      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32000, message: error.message || 'Internal error' }
      };
    }
  }

  static async executeTool(name: string, args: any, user: UserType): Promise<any> {
    const safeArgs = args && typeof args === 'object' && !Array.isArray(args) ? args : {};

    switch (name) {
      case 'mjolnir_list_user_stories': {
        const { assignedUser = 'me', sprint = 'active', featureId, status, limit = 25 } = safeArgs;
        const filter: any = {};

        if (assignedUser === 'me') {
          if (user?._id) filter.assignedUser = user._id;
        } else if (assignedUser !== 'all' && typeof assignedUser === 'string' && mongoose.Types.ObjectId.isValid(assignedUser)) {
          filter.assignedUser = new mongoose.Types.ObjectId(assignedUser);
        }

        if (sprint === 'active') {
          const activeSprint = await SprintService.getActiveSprint();
          if (activeSprint) {
            filter.sprintId = activeSprint._id;
          } else {
            filter.sprintId = null;
          }
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
        const sliced = stories.slice(0, parsedLimit);
        
        // Lean projection for lists (saves ~70% tokens)
        const userStories = sliced.map((s: any) => ({
          _id: s._id,
          title: s.title,
          status: s.status,
          storyPoints: s.storyPoints,
          featureId: s.featureId,
          sprintId: s.sprintId || undefined,
          assignedUser: s.assignedUser ? (typeof s.assignedUser === 'object' && s.assignedUser.name ? s.assignedUser.name : s.assignedUser) : undefined
        }));

        return {
          count: userStories.length,
          userStories
        };
      }

      case 'mjolnir_get_user_story': {
        const { id } = safeArgs;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
          throw new Error('Valid user story ID is required');
        }
        const story = await UserStoryService.getById(id);
        if (!story) throw new Error('User story not found');
        return {
          userStory: {
            _id: story._id,
            title: story.title,
            description: story.description,
            storyPoints: story.storyPoints,
            status: story.status,
            featureId: story.featureId,
            sprintId: story.sprintId,
            assignedUser: story.assignedUser
          }
        };
      }

      case 'mjolnir_create_user_story': {
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
          userStory: {
            _id: created._id,
            title: created.title,
            storyPoints: created.storyPoints,
            status: created.status,
            featureId: created.featureId,
            sprintId: created.sprintId
          }
        };
      }

      case 'mjolnir_update_user_story_status': {
        const { id, status } = safeArgs;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) throw new Error('Valid user story ID is required');
        if (!status || !['To Do', 'In Progress', 'Blocked', 'Waiting for MR', 'Done'].includes(status)) {
          throw new Error('Valid status is required ("To Do", "In Progress", "Blocked", "Waiting for MR", "Done")');
        }

        const updated = await UserStoryService.update(id, { status: status as UserStoryStatus });
        if (!updated) throw new Error('User story not found');
        return {
          message: 'User story status updated successfully',
          userStory: {
            _id: updated._id,
            title: updated.title,
            status: updated.status
          }
        };
      }

      case 'mjolnir_list_features': {
        const { epicId } = safeArgs;
        const filter: any = {};
        if (epicId && typeof epicId === 'string' && mongoose.Types.ObjectId.isValid(epicId)) {
          filter.epicId = epicId;
        }
        const features = await FeatureService.getAll(filter);
        const leanFeatures = features.map((f: any) => ({
          _id: f._id,
          title: f.title,
          status: f.status,
          epicId: f.epicId
        }));
        return {
          count: leanFeatures.length,
          features: leanFeatures
        };
      }

      case 'mjolnir_list_epics': {
        const epics = await EpicService.getAll();
        const leanEpics = epics.map((e: any) => ({
          _id: e._id,
          title: e.title,
          status: e.status
        }));
        return {
          count: leanEpics.length,
          epics: leanEpics
        };
      }

      case 'mjolnir_get_active_sprint': {
        const activeSprint = await SprintService.getActiveSprint();
        return {
          activeSprint: activeSprint ? {
            _id: activeSprint._id,
            name: activeSprint.name,
            startDate: activeSprint.startDate,
            endDate: activeSprint.endDate
          } : null
        };
      }

      case 'mjolnir_list_team_members': {
        const members = await UserService.getApprovedUsers();
        const leanMembers = members.map((m: any) => ({
          _id: m._id,
          name: m.name,
          email: m.email
        }));
        return {
          count: leanMembers.length,
          members: leanMembers
        };
      }

      case 'mjolnir_get_current_user': {
        return {
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin
          }
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
}
