import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import crypto from 'crypto';
import ApiKeyModel from '../models/ApiKey.js';
import User from '../models/User.js';
import { EpicDAL } from '../dal/EpicDAL.js';
import { FeatureDAL } from '../dal/FeatureDAL.js';
import { UserStoryDAL } from '../dal/UserStoryDAL.js';
import { UserStoryService } from '../services/UserStoryService.js';
import { SprintService } from '../services/SprintService.js';
import { UserStoryStatus } from '../models/UserStory.js';

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
    description: 'Fetch existing tasks (user stories) from the Mjolnir agile board with optional status filtering.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        status: {
          type: 'string',
          description: 'Filter by status (To Do, In Progress, Blocked, Waiting for MR, Done)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of tasks to return (default: 50, max: 500)',
        },
      },
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
      },
      required: ['title', 'featureId'],
    },
  },
  {
    name: 'mjolnir_update_task_status',
    description: 'Update the status of an existing task on the Mjolnir agile board. Cascades activation to parent feature/epic, or marks feature done if all sibling stories are done.',
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

          case 'mjolnir_list_tasks': {
            const query: any = {};
            if (typedArgs.status && typeof typedArgs.status === 'string') {
              query.status = typedArgs.status;
            }

            const limit = Math.min(parseInt(typedArgs.limit as any) || 50, 500);

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
                limit,
                sort: { createdAt: -1 },
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
            const { title, description, storyPoints, featureId } = typedArgs;

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

            const userId = await this.resolveUserId(apiKeyString);

            const newStory = await UserStoryDAL.create({
              title,
              description: description || '',
              status: 'To Do',
              storyPoints: points,
              featureId: featureId as any,
              sprintId: currentSprint._id as any,
              assignedUser: userId as any,
            });

            return {
              content: [
                {
                  type: 'text' as const,
                  text: JSON.stringify(
                    {
                      _id: (newStory as any)._id,
                      title: (newStory as any).title,
                      description: (newStory as any).description,
                      status: (newStory as any).status,
                      storyPoints: (newStory as any).storyPoints,
                      createdAt: (newStory as any).createdAt,
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

            return {
              content: [
                {
                  type: 'text' as const,
                  text: JSON.stringify(
                    {
                      _id: (updatedStory as any)._id,
                      title: (updatedStory as any).title,
                      description: (updatedStory as any).description,
                      status: (updatedStory as any).status,
                      storyPoints: (updatedStory as any).storyPoints,
                      updatedAt: (updatedStory as any).updatedAt,
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
