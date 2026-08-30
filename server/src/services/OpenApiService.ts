export class OpenApiService {
  static getSpec(serverUrl: string = '/api') {
    return {
      openapi: '3.0.3',
      info: {
        title: 'Mjolnir Agile Board Agent API',
        description:
          'API for AI agents, Gemini Web Custom Gems, Claude Web Custom Connectors, and CLIs to interact with Mjolnir agile boards. Enables reading epics, features, user stories, creating tasks, and updating task status with status inheritance.',
        version: '1.0.0',
      },
      servers: [
        {
          url: serverUrl,
          description: 'Mjolnir API Server',
        },
      ],
      security: [
        { ApiKeyAuth: [] },
        { BearerAuth: [] },
      ],
      paths: {
        '/agent/tasks/epic': {
          get: {
            summary: 'List all Epics',
            description: 'Fetch all epics on the Mjolnir board with their status and descriptions.',
            operationId: 'listEpics',
            tags: ['Epics'],
            security: [{ ApiKeyAuth: [] }, { BearerAuth: [] }],
            responses: {
              '200': {
                description: 'List of epics',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Epic',
                      },
                    },
                  },
                },
              },
              '401': { $ref: '#/components/responses/Unauthorized' },
              '403': { $ref: '#/components/responses/Forbidden' },
            },
          },
        },
        '/agent/tasks/feature': {
          get: {
            summary: 'List all Features',
            description: 'Fetch all features on the Mjolnir board.',
            operationId: 'listFeatures',
            tags: ['Features'],
            security: [{ ApiKeyAuth: [] }, { BearerAuth: [] }],
            responses: {
              '200': {
                description: 'List of features',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Feature',
                      },
                    },
                  },
                },
              },
              '401': { $ref: '#/components/responses/Unauthorized' },
              '403': { $ref: '#/components/responses/Forbidden' },
            },
          },
        },
        '/agent/tasks/sprint': {
          get: {
            summary: 'List all Sprints',
            description: 'Fetch all sprints with their names, start dates, and end dates.',
            operationId: 'listSprints',
            tags: ['Sprints'],
            security: [{ ApiKeyAuth: [] }, { BearerAuth: [] }],
            responses: {
              '200': {
                description: 'List of sprints',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Sprint',
                      },
                    },
                  },
                },
              },
              '401': { $ref: '#/components/responses/Unauthorized' },
            },
          },
        },
        '/agent/tasks/user': {
          get: {
            summary: 'List all Users',
            description: 'Fetch all approved users on the board.',
            operationId: 'listUsers',
            tags: ['Users'],
            security: [{ ApiKeyAuth: [] }, { BearerAuth: [] }],
            responses: {
              '200': {
                description: 'List of users',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/User',
                      },
                    },
                  },
                },
              },
              '401': { $ref: '#/components/responses/Unauthorized' },
            },
          },
        },
        '/agent/tasks/me': {
          get: {
            summary: 'Get Current User Profile',
            description: 'Fetch the profile of the user associated with the authenticated API key (whoami).',
            operationId: 'getCurrentUser',
            tags: ['Users'],
            security: [{ ApiKeyAuth: [] }, { BearerAuth: [] }],
            responses: {
              '200': {
                description: 'Current user profile',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/User',
                    },
                  },
                },
              },
              '401': { $ref: '#/components/responses/Unauthorized' },
            },
          },
        },
        '/agent/tasks/us': {
          get: {
            summary: 'List User Stories / Tasks',
            description: 'Fetch user stories / tasks from the active sprint or backlog with optional status, user, and sprint filtering.',
            operationId: 'listTasks',
            tags: ['Tasks'],
            security: [{ ApiKeyAuth: [] }, { BearerAuth: [] }],
            parameters: [
              {
                name: 'status',
                in: 'query',
                description: 'Filter tasks by status',
                required: false,
                schema: {
                  type: 'string',
                  enum: ['To Do', 'In Progress', 'Blocked', 'Waiting for MR', 'Done'],
                },
              },
              {
                name: 'assignedUser',
                in: 'query',
                description: 'Filter tasks by assigned user name, email, user ID, or "me"',
                required: false,
                schema: {
                  type: 'string',
                },
              },
              {
                name: 'sprint',
                in: 'query',
                description: 'Filter tasks by sprint name (e.g. "Sprint 4") or sprint ID',
                required: false,
                schema: {
                  type: 'string',
                },
              },
              {
                name: 'sprintId',
                in: 'query',
                description: 'Filter tasks by sprint ID',
                required: false,
                schema: {
                  type: 'string',
                },
              },
              {
                name: 'limit',
                in: 'query',
                description: 'Maximum number of tasks to return (default: 50, max: 500)',
                required: false,
                schema: {
                  type: 'integer',
                  default: 50,
                },
              },
              {
                name: 'sortBy',
                in: 'query',
                description: 'Field to sort tasks by (default: createdAt)',
                required: false,
                schema: {
                  type: 'string',
                  default: 'createdAt',
                },
              },
            ],
            responses: {
              '200': {
                description: 'List of tasks',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/UserStory',
                      },
                    },
                  },
                },
              },
              '401': { $ref: '#/components/responses/Unauthorized' },
              '403': { $ref: '#/components/responses/Forbidden' },
            },
          },
          post: {
            summary: 'Create a new Task / User Story',
            description: 'Create a task associated with a parent feature and active sprint.',
            operationId: 'createTask',
            tags: ['Tasks'],
            security: [{ ApiKeyAuth: [] }, { BearerAuth: [] }],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/CreateTaskRequest',
                  },
                },
              },
            },
            responses: {
              '201': {
                description: 'Task successfully created',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/UserStory',
                    },
                  },
                },
              },
              '400': { description: 'Validation error or missing required fields' },
              '401': { $ref: '#/components/responses/Unauthorized' },
              '403': { $ref: '#/components/responses/Forbidden' },
            },
          },
        },
        '/agent/tasks/us/{id}/status': {
          patch: {
            summary: 'Update Task Status',
            description: 'Update the status of a user story. Automatically cascades activation to parent feature and grandparent epic, or marks feature done if all sibling stories are done.',
            operationId: 'updateTaskStatus',
            tags: ['Tasks'],
            security: [{ ApiKeyAuth: [] }, { BearerAuth: [] }],
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                description: 'The User Story ID',
                schema: {
                  type: 'string',
                },
              },
            ],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/UpdateStatusRequest',
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'Task status updated successfully',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/UserStory',
                    },
                  },
                },
              },
              '400': { description: 'Invalid status value' },
              '404': { description: 'Task not found' },
              '401': { $ref: '#/components/responses/Unauthorized' },
              '403': { $ref: '#/components/responses/Forbidden' },
            },
          },
        },
      },
      components: {
        securitySchemes: {
          ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'x-api-key',
            description: 'Mjolnir API Key provided in the x-api-key header',
          },
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            description: 'Mjolnir API Key provided as Bearer token',
          },
        },
        schemas: {
          Epic: {
            type: 'object',
            properties: {
              _id: { type: 'string', description: 'Epic ID' },
              title: { type: 'string', description: 'Epic Title' },
              description: { type: 'string', description: 'Epic Description' },
              status: {
                type: 'string',
                enum: ['To Do', 'In Progress', 'Blocked', 'Done'],
              },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          Feature: {
            type: 'object',
            properties: {
              _id: { type: 'string', description: 'Feature ID' },
              title: { type: 'string', description: 'Feature Title' },
              description: { type: 'string', description: 'Feature Description' },
              status: {
                type: 'string',
                enum: ['To Do', 'In Progress', 'Blocked', 'Done'],
              },
            },
          },
          Sprint: {
            type: 'object',
            properties: {
              _id: { type: 'string', description: 'Sprint ID' },
              name: { type: 'string', description: 'Sprint Name' },
              startDate: { type: 'string', format: 'date-time' },
              endDate: { type: 'string', format: 'date-time' },
            },
          },
          User: {
            type: 'object',
            properties: {
              _id: { type: 'string', description: 'User ID' },
              name: { type: 'string', description: 'User Name' },
              email: { type: 'string', description: 'User Email' },
              isAdmin: { type: 'boolean' },
              isApproved: { type: 'boolean' },
            },
          },
          UserStory: {
            type: 'object',
            properties: {
              _id: { type: 'string', description: 'Task / User Story ID' },
              title: { type: 'string', description: 'Task Title' },
              description: { type: 'string', description: 'Task Description' },
              status: {
                type: 'string',
                enum: ['To Do', 'In Progress', 'Blocked', 'Waiting for MR', 'Done'],
              },
              storyPoints: {
                type: 'integer',
                enum: [1, 3, 5, 8, 666],
                description: 'Fibonacci story points estimation',
              },
              priority: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' } },
              assignedUser: {
                type: 'object',
                nullable: true,
                properties: {
                  _id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                },
              },
              sprint: {
                type: 'object',
                nullable: true,
                properties: {
                  _id: { type: 'string' },
                  name: { type: 'string' },
                  startDate: { type: 'string', format: 'date-time' },
                  endDate: { type: 'string', format: 'date-time' },
                },
              },
              sprintId: { type: 'string', nullable: true },
              feature: {
                type: 'object',
                nullable: true,
                properties: {
                  _id: { type: 'string' },
                  title: { type: 'string' },
                },
              },
              featureId: { type: 'string', nullable: true },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          CreateTaskRequest: {
            type: 'object',
            required: ['title', 'featureId'],
            properties: {
              title: {
                type: 'string',
                description: 'Task Title',
                example: 'Implement OAuth Google Login',
              },
              featureId: {
                type: 'string',
                description: 'ID of the parent Feature',
                example: '60d0fe4f5311236168a109ca',
              },
              description: {
                type: 'string',
                description: 'Detailed description of the task',
                example: 'Verify Google token and issue JWT session cookie.',
              },
              storyPoints: {
                type: 'integer',
                enum: [1, 3, 5, 8, 666],
                default: 5,
                description: 'Story points (1, 3, 5, 8, or 666)',
              },
            },
          },
          UpdateStatusRequest: {
            type: 'object',
            required: ['status'],
            properties: {
              status: {
                type: 'string',
                enum: ['To Do', 'In Progress', 'Blocked', 'Waiting for MR', 'Done'],
                description: 'New status for the task',
                example: 'In Progress',
              },
            },
          },
        },
        responses: {
          Unauthorized: {
            description: 'Missing or invalid API key',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Unauthorized: Missing API key' },
                  },
                },
              },
            },
          },
          Forbidden: {
            description: 'API key revoked or missing required scope',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Forbidden: Scope read:tasks not granted' },
                  },
                },
              },
            },
          },
        },
      },
    };
  }

  static toYaml(spec: any): string {
    const formatYaml = (obj: any, indent: number = 0): string => {
      const pad = ' '.repeat(indent);
      if (obj === null || obj === undefined) return 'null';
      if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
      if (typeof obj === 'string') {
        if (obj.includes('\n') || obj.includes(':') || obj.includes('#') || obj.startsWith('{') || obj.startsWith('[')) {
          return JSON.stringify(obj);
        }
        return obj || "''";
      }
      if (Array.isArray(obj)) {
        if (obj.length === 0) return '[]';
        return obj
          .map((item) => {
            if (typeof item === 'object' && item !== null) {
              const formatted = formatYaml(item, indent + 2).trimStart();
              return `${pad}- ${formatted}`;
            }
            return `${pad}- ${formatYaml(item, 0)}`;
          })
          .join('\n');
      }
      if (typeof obj === 'object') {
        const keys = Object.keys(obj);
        if (keys.length === 0) return '{}';
        return keys
          .map((k) => {
            const v = obj[k];
            if (typeof v === 'object' && v !== null && (Array.isArray(v) ? v.length > 0 : Object.keys(v).length > 0)) {
              return `${pad}${k}:\n${formatYaml(v, indent + 2)}`;
            }
            return `${pad}${k}: ${formatYaml(v, indent + 2)}`;
          })
          .join('\n');
      }
      return String(obj);
    };

    return formatYaml(spec);
  }
}
