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
        '/agent/tasks/us': {
          get: {
            summary: 'List User Stories / Tasks',
            description: 'Fetch user stories / tasks from the active sprint or backlog with optional status filtering.',
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
                description: 'Field to sort by (default: createdAt)',
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
            summary: 'Create a Task / User Story',
            description: 'Create a new task on the Mjolnir agile board associated with a specific feature and the active sprint.',
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
                description: 'Task created successfully',
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
