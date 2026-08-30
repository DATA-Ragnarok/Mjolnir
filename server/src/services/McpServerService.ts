import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import crypto from 'crypto';
import mongoose from 'mongoose';
import ApiKeyModel from '../models/ApiKey.js';
import User from '../models/User.js';
import Sprint from '../models/Sprint.js';
import UserStory, { UserStoryStatus } from '../models/UserStory.js';
import { EpicDAL } from '../dal/EpicDAL.js';
import { FeatureDAL } from '../dal/FeatureDAL.js';
import { UserStoryDAL } from '../dal/UserStoryDAL.js';
import { UserStoryService } from '../services/UserStoryService.js';
import { SprintService } from '../services/SprintService.js';

export const MCP_TOOLS: Tool[] = [
  {
    name: 'mjolnir_list_epics',
    description: 'Fetch all epics on the Mjolnir agile board with their status and descriptions.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'mjolnir_list_features',
    description: 'Fetch all features on the Mjolnir agile board.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'mjolnir_list_tasks',
    description:
      'Fetch tasks (user stories) from the Mjolnir agile board with populated assigned user, sprint, and feature details. Supports filtering by status, assigned user, sprint, and limit.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        status: {
          type: 'string',
          description: 'Filter by status: "To Do", "In Progress", "Blocked", "Waiting for MR", or "Done"',
        },
        assignedUser: {
          type: 'string',
          description:
            'Filter by assigned user name, email, user ID, or "me" for the currently authenticated user/key owner',
        },
        sprint: {
          type: 'string',
          description: 'Filter by sprint name (e.g. "Sprint 4") or sprint ID',
        },
        sprintId: {
          type: 'string',
          description: 'Filter directly by sprint ID',
        },
        featureId: {
          type: 'string',
          description: 'Filter by parent feature ID',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of tasks to return (default: 50, max: 500)',
        },
      },
    },
  },
  {
    name: 'mjolnir_list_sprints',
    description: 'Fetch all sprints on the Mjolnir agile board with their names, start dates, and end dates.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'mjolnir_list_users',
    description: 'Fetch all approved users on the Mjolnir agile board with their ID, name, and email.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'mjolnir_get_current_user',
    description: 'Get profile details of the user associated with the current API key/connection session (whoami).',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'mjolnir_create_task',
    description: 'Create a new task on the Mjolnir agile board associated with a parent feature and the active sprint.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        title: {
          type: 'string',
          description: 'Task title (required)',
        },
        description: {
          type: 'string',
          description: 'Task description',
        },
        storyPoints: {
          type: 'number',
          description: 'Story points Fibonacci estimate: 1, 3, 5, 8, or 666 (default: 5)',
        },
        featureId: {
          type: 'string',
          description: 'Parent Feature ID to associate with this task (required)',
        },
        assignedUserId: {
          type: 'string',
          description: 'Optional User ID to assign this task to (defaults to authenticated key owner)',
        },
      },
      required: ['title', 'featureId'],
    },
  },
  {
    name: 'mjolnir_update_task_status',
    description:
      'Update the status of an existing task on the Mjolnir agile board. Cascades activation to parent feature/epic, or marks feature done if all sibling stories are done.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        taskId: {
          type: 'string',
          description: 'The User Story / Task ID (required)',
        },
        status: {
          type: 'string',
          description: 'New status: "To Do", "In Progress", "Blocked", "Waiting for MR", or "Done" (required)',
        },
      },
      required: ['taskId', 'status'],
    },
  },
];

const computeHash = (key: string): string => {
  return crypto.createHash('sha256').update(key).digest('hex');
};

export class McpServerService {
  static async resolveUserId(apiKeyString?: string | null): Promise<string | null> {
    if (apiKeyString) {
      const keyHash = computeHash(apiKeyString);
      const dbKey = await ApiKeyModel.findOne({ keyHash, isActive: true });
      if (dbKey) {
        ApiKeyModel.updateOne({ _id: dbKey._id }, { lastUsedAt: new Date() }).catch(() => {});
        return dbKey.createdByUserId.toString();
      }
    }

    // Fallback to first approved admin user if no key or key not matched
    const adminUser = await User.findOne({ isApproved: true, isAdmin: true });
    if (adminUser) {
      return adminUser._id.toString();
    }

    const anyUser = await User.findOne({ isApproved: true });
    return anyUser ? anyUser._id.toString() : null;
  }

  static createServer(apiKeyString?: string | null): Server {
    const server = new Server(
      {
        name: 'mjolnir-remote-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // List tools handler
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: MCP_TOOLS,
    }));

    // Call tool handler
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: toolArgs } = request.params;
      const typedArgs = (toolArgs || {}) as Record<string, any>;

      try {
        switch (name) {
          case 'mjolnir_list_epics': {
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

            return {
              content: [
                {
                  type: 'text' as const,
                  text: JSON.stringify(sanitized, null, 2),
                },
              ],
            };
          }

          case 'mjolnir_list_features':
          case 'mjolnir_list_feature': {
            const features = await FeatureDAL.find(
              {},
              {
                _id: 1,
                title: 1,
                description: 1,
                status: 1,
              }
            );

            const sanitized = features.map((feature: any) => ({
              _id: feature._id,
              title: feature.title,
              description: feature.description,
              status: feature.status,
            }));

            return {
              content: [
                {
                  type: 'text' as const,
                  text: JSON.stringify(sanitized, null, 2),
                },
              ],
            };
          }

          case 'mjolnir_list_sprints': {
            const sprints = await Sprint.find().sort({ startDate: -1 });
            const sanitized = sprints.map((s: any) => ({
              _id: s._id,
              name: s.name,
              startDate: s.startDate,
              endDate: s.endDate,
              createdAt: s.createdAt,
            }));

            return {
              content: [
                {
                  type: 'text' as const,
                  text: JSON.stringify(sanitized, null, 2),
                },
              ],
            };
          }

          case 'mjolnir_list_users': {
            const users = await User.find(
              { isApproved: true },
              { _id: 1, name: 1, email: 1, isAdmin: 1 }
            );

            const sanitized = users.map((u: any) => ({
              _id: u._id,
              name: u.name,
              email: u.email,
              isAdmin: u.isAdmin,
            }));

            return {
              content: [
                {
                  type: 'text' as const,
                  text: JSON.stringify(sanitized, null, 2),
                },
              ],
            };
          }

          case 'mjolnir_get_current_user':
          case 'mjolnir_whoami': {
            const userId = await McpServerService.resolveUserId(apiKeyString);
            if (!userId) {
              return {
                content: [{ type: 'text' as const, text: 'Error: No user found for current session' }],
                isError: true,
              };
            }

            const user = await User.findById(userId);
            if (!user) {
              return {
                content: [{ type: 'text' as const, text: 'Error: User not found' }],
                isError: true,
              };
            }

            return {
              content: [
                {
                  type: 'text' as const,
                  text: JSON.stringify(
                    {
                      _id: user._id,
                      name: user.name,
                      email: user.email,
                      isAdmin: user.isAdmin,
                      isApproved: user.isApproved,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          case 'mjolnir_list_tasks': {
            const query: any = {};
            if (typedArgs.status && typeof typedArgs.status === 'string') {
              query.status = typedArgs.status;
            }

            if (typedArgs.featureId && typeof typedArgs.featureId === 'string') {
              query.featureId = typedArgs.featureId;
            }

            if (typedArgs.sprintId && typeof typedArgs.sprintId === 'string') {
              query.sprintId = typedArgs.sprintId;
            } else if (typedArgs.sprint && typeof typedArgs.sprint === 'string') {
              const sprintVal = typedArgs.sprint.trim();
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

            if (typedArgs.assignedUser && typeof typedArgs.assignedUser === 'string') {
              const userVal = typedArgs.assignedUser.trim();
              if (userVal.toLowerCase() === 'me') {
                const resolvedId = await McpServerService.resolveUserId(apiKeyString);
                if (resolvedId) {
                  query.assignedUser = resolvedId;
                }
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

            const limit = Math.min(parseInt(typedArgs.limit as any) || 50, 500);

            const stories = await UserStory.find(query)
              .populate('assignedUser')
              .populate('sprintId')
              .populate('featureId')
              .limit(limit)
              .sort({ createdAt: -1 });

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

            return {
              content: [
                {
                  type: 'text' as const,
                  text: JSON.stringify(sanitized, null, 2),
                },
              ],
            };
          }

          case 'mjolnir_create_task': {
            const { title, description, storyPoints, featureId, assignedUserId } = typedArgs;

            if (!title || typeof title !== 'string') {
              return {
                content: [{ type: 'text' as const, text: 'Error: title is required and must be a string' }],
                isError: true,
              };
            }

            if (!featureId || typeof featureId !== 'string') {
              return {
                content: [{ type: 'text' as const, text: 'Error: featureId is required and must be a string' }],
                isError: true,
              };
            }

            const points = Number(storyPoints || 5);
            if (![1, 3, 5, 8, 666].includes(points)) {
              return {
                content: [{ type: 'text' as const, text: 'Error: storyPoints must be 1, 3, 5, 8, or 666' }],
                isError: true,
              };
            }

            const feature = await FeatureDAL.findById(featureId);
            if (!feature) {
              return {
                content: [{ type: 'text' as const, text: 'Error: Feature not found' }],
                isError: true,
              };
            }

            const currentSprint = await SprintService.getCurrentSprint();
            if (!currentSprint) {
              return {
                content: [{ type: 'text' as const, text: 'Error: No active sprint available' }],
                isError: true,
              };
            }

            const resolvedUserId = assignedUserId || (await McpServerService.resolveUserId(apiKeyString));

            const newStory = await UserStoryDAL.create({
              title,
              description: description || '',
              status: 'To Do',
              storyPoints: points,
              featureId: featureId as any,
              sprintId: currentSprint._id as any,
              assignedUser: resolvedUserId as any,
            });

            const populated = await UserStory.findById(newStory._id)
              .populate('assignedUser')
              .populate('sprintId')
              .populate('featureId');

            return {
              content: [
                {
                  type: 'text' as const,
                  text: JSON.stringify(
                    {
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
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          case 'mjolnir_update_task_status': {
            const { taskId, id, status } = typedArgs;
            const targetId = taskId || id;

            if (!targetId || typeof targetId !== 'string') {
              return {
                content: [{ type: 'text' as const, text: 'Error: taskId is required and must be a string' }],
                isError: true,
              };
            }

            const validStatuses: UserStoryStatus[] = [
              'To Do',
              'In Progress',
              'Blocked',
              'Waiting for MR',
              'Done',
            ];
            if (!status || !validStatuses.includes(status)) {
              return {
                content: [
                  {
                    type: 'text' as const,
                    text: `Error: status must be one of: ${validStatuses.join(', ')}`,
                  },
                ],
                isError: true,
              };
            }

            const updatedStory = await UserStoryService.update(targetId, { status });
            if (!updatedStory) {
              return {
                content: [{ type: 'text' as const, text: 'Error: Task not found' }],
                isError: true,
              };
            }

            const populated = await UserStory.findById(updatedStory._id)
              .populate('assignedUser')
              .populate('sprintId')
              .populate('featureId');

            return {
              content: [
                {
                  type: 'text' as const,
                  text: JSON.stringify(
                    {
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
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          default:
            return {
              content: [{ type: 'text' as const, text: `Unknown tool: ${name}` }],
              isError: true,
            };
        }
      } catch (error: any) {
        return {
          content: [{ type: 'text' as const, text: `Error executing ${name}: ${error.message}` }],
          isError: true,
        };
      }
    });

    return server;
  }
}
