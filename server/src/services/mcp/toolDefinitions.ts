import { McpToolDefinition } from './types.js';

export const MCP_TOOLS: McpToolDefinition[] = [
  {
    name: 'list_user_stories',
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
    name: 'get_user_story',
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
    name: 'create_user_story',
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
    name: 'update_user_story_status',
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
    name: 'list_features',
    description: 'Lists features to locate valid featureId.',
    inputSchema: {
      type: 'object',
      properties: {
        epicId: { type: 'string', description: 'Optional parent epic ID filter' }
      }
    }
  },
  {
    name: 'list_epics',
    description: 'Lists all epics.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_active_sprint',
    description: 'Gets the currently active sprint.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'list_team_members',
    description: 'Lists approved users for story assignment.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_current_user',
    description: 'Gets authenticated user profile.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];
