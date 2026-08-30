#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

const apiKey = process.env.MJOLNIR_API_KEY;
const rawApiUrl = (process.env.MJOLNIR_API_URL || 'https://api.mjolnir.dev').replace(/\/+$/, '');
const apiUrl = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

if (!apiKey) {
  console.error('Error: MJOLNIR_API_KEY environment variable not set');
  process.exit(1);
}

const apiClient = axios.create({
  baseURL: apiUrl,
  headers: {
    'x-api-key': apiKey,
    'Content-Type': 'application/json',
  },
});

// Define available tools
const tools: Tool[] = [
  {
    name: 'mjolnir_list_epics',
    description: 'Fetch existing epics from the Mjolnir agile board.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'mjolnir_list_features',
    description: 'Fetch existing features from the Mjolnir agile board.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'mjolnir_list_feature',
    description: 'Fetch existing features from the Mjolnir agile board (alias).',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'mjolnir_list_tasks',
    description:
      'Fetch existing tasks from the Mjolnir agile board with populated assigned user and sprint details, plus optional filtering.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        status: {
          type: 'string',
          description: 'Filter by status (To Do, In Progress, Blocked, Waiting for MR, Done)',
        },
        assignedUser: {
          type: 'string',
          description:
            'Filter by assigned user name, email, user ID, or "me" for the current authenticated user',
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
    description: 'Get profile details of the user associated with the current API key (whoami).',
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
          description: 'Story points (1, 3, 5, 8, or 666)',
        },
        featureId: {
          type: 'string',
          description: 'Feature ID to associate with this task (required)',
        },
        assignedUserId: {
          type: 'string',
          description: 'Optional User ID to assign to the task',
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

// Initialize MCP server
const server = new Server(
  {
    name: 'mjolnir-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handlers for tool listing
const listToolsHandler = async (): Promise<any> => ({
  tools,
});

server.setRequestHandler(ListToolsRequestSchema, listToolsHandler);

// Handler for tool calls
const callToolHandler = async (request: any): Promise<any> => {
  const params = request.params || request;
  const { name, arguments: toolArgs } = params;
  const typedArgs = (toolArgs || {}) as Record<string, any>;

  try {
    switch (name) {
      case 'mjolnir_list_epics': {
        const response = await apiClient.get('agent/tasks/epic');
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'mjolnir_list_feature':
      case 'mjolnir_list_features': {
        const response = await apiClient.get('agent/tasks/feature');
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'mjolnir_list_sprints': {
        const response = await apiClient.get('agent/tasks/sprint');
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'mjolnir_list_users': {
        const response = await apiClient.get('agent/tasks/user');
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'mjolnir_get_current_user':
      case 'mjolnir_whoami': {
        const response = await apiClient.get('agent/tasks/me');
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'mjolnir_list_tasks': {
        const queryParams: Record<string, any> = {};
        if (typedArgs.status) queryParams.status = typedArgs.status;
        if (typedArgs.limit) queryParams.limit = typedArgs.limit;
        if (typedArgs.assignedUser) queryParams.assignedUser = typedArgs.assignedUser;
        if (typedArgs.sprint) queryParams.sprint = typedArgs.sprint;
        if (typedArgs.sprintId) queryParams.sprintId = typedArgs.sprintId;
        if (typedArgs.featureId) queryParams.featureId = typedArgs.featureId;

        const response = await apiClient.get('agent/tasks/us', { params: queryParams });
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'mjolnir_create_task': {
        const { title, description, storyPoints, featureId, assignedUserId } = typedArgs;

        if (!title || typeof title !== 'string') {
          return {
            content: [
              {
                type: 'text' as const,
                text: 'Error: title is required and must be a string',
              },
            ],
            isError: true,
          };
        }

        if (!featureId || typeof featureId !== 'string') {
          return {
            content: [
              {
                type: 'text' as const,
                text: 'Error: featureId is required and must be a string',
              },
            ],
            isError: true,
          };
        }

        const payload: Record<string, any> = {
          title,
          description: description || '',
          storyPoints: storyPoints || 5,
          featureId,
        };
        if (assignedUserId) {
          payload.assignedUserId = assignedUserId;
        }

        const response = await apiClient.post('agent/tasks/us', payload);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'mjolnir_update_task_status': {
        const { taskId, id, status } = typedArgs;
        const targetId = taskId || id;

        if (!targetId || typeof targetId !== 'string') {
          return {
            content: [
              {
                type: 'text' as const,
                text: 'Error: taskId is required and must be a string',
              },
            ],
            isError: true,
          };
        }

        if (!status || typeof status !== 'string') {
          return {
            content: [
              {
                type: 'text' as const,
                text: 'Error: status is required and must be a string',
              },
            ],
            isError: true,
          };
        }

        const response = await apiClient.patch(`agent/tasks/us/${targetId}/status`, { status });
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: 'text' as const,
              text: `Unknown tool: ${name}`,
            },
          ],
          isError: true,
        };
    }
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || error.message || 'Unknown error occurred';
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
};

server.setRequestHandler(CallToolRequestSchema, callToolHandler);


// Main execution
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
