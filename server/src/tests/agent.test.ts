import request from 'supertest';
import http from 'http';
import { connectTestDB, clearTestDB, closeTestDB } from './testHelper.js';
import { jest } from '@jest/globals';

let mockUserPayload = {
  sub: 'test-google-id-1',
  email: 'admin@example.com',
  name: 'Admin User',
};

// Mock google-auth-library
jest.unstable_mockModule('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: jest.fn().mockImplementation(async () => ({
      getPayload: () => mockUserPayload,
    })),
  })),
}));

const { app } = await import('../index.js');
const { getAuthToken } = await import('./authHelper.js');
const { UserService } = await import('../services/UserService.js');
const { ApiKeyService } = await import('../services/ApiKeyService.js');

describe('SPEC-AGENT-INTEGRATION E2E Tests', () => {
  let adminJwtToken: string;
  let adminApiKey: string;
  let adminUser: any;
  let epicId: string;
  let featureId: string;
  let sprintId: string;

  beforeAll(async () => {
    jest.setTimeout(30000);
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    mockUserPayload = {
      sub: 'test-google-id-1',
      email: 'admin@example.com',
      name: 'Admin User',
    };

    // First user login makes them admin and approved
    const loginRes = await request(app)
      .post('/api/auth/google')
      .send({ idToken: 'fake-token' });

    adminJwtToken = loginRes.body.token;
    adminUser = loginRes.body.user;

    // Generate API key for admin
    const keyRes = await request(app)
      .post('/api/auth/api-key')
      .set('Authorization', `Bearer ${adminJwtToken}`)
      .send({ name: 'Integration Test Key' });

    adminApiKey = keyRes.body.apiKey.key;

    // Create an Epic
    const epicRes = await request(app)
      .post('/api/epics')
      .set('Authorization', `Bearer ${adminJwtToken}`)
      .send({ title: 'Agent Test Epic', status: 'To Do' });
    epicId = epicRes.body._id;

    // Create a Feature
    const featureRes = await request(app)
      .post('/api/features')
      .set('Authorization', `Bearer ${adminJwtToken}`)
      .send({ title: 'Agent Test Feature', epicId, status: 'To Do' });
    featureId = featureRes.body._id;

    // Create an active Sprint
    const now = new Date();
    const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // yesterday
    const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // in 7 days
    const sprintRes = await request(app)
      .post('/api/sprints')
      .set('Authorization', `Bearer ${adminJwtToken}`)
      .send({
        name: 'Sprint 1',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
    sprintId = sprintRes.body._id;
  });

  afterAll(async () => {
    await closeTestDB();
  });

  describe('API Key Generation & Authentication Gatekeeper', () => {
    it('should generate and retrieve API key via /api/auth/api-key', async () => {
      const getRes = await request(app)
        .get('/api/auth/api-key')
        .set('Authorization', `Bearer ${adminJwtToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.apiKey.key).toBe(adminApiKey);
      expect(getRes.body.apiKey.key.startsWith('mj_live_')).toBe(true);
    });

    it('should authenticate agent using x-api-key header', async () => {
      const res = await request(app)
        .get('/api/agent/me')
        .set('x-api-key', adminApiKey);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe('admin@example.com');
    });

    it('should authenticate agent using Bearer mj_live_ key', async () => {
      const res = await request(app)
        .get('/api/agent/me')
        .set('Authorization', `Bearer ${adminApiKey}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe('admin@example.com');
    });

    it('should reject request with 401 if API key is missing or invalid', async () => {
      const resMissing = await request(app).get('/api/agent/me');
      expect(resMissing.status).toBe(401);

      const resInvalid = await request(app)
        .get('/api/agent/me')
        .set('x-api-key', 'mj_live_invalidkey123456');
      expect(resInvalid.status).toBe(401);
    });

    it('should reject request with 403 if user is not approved', async () => {
      // Create a second unapproved user
      mockUserPayload = {
        sub: 'unapproved-user-id',
        email: 'unapproved@example.com',
        name: 'Unapproved User',
      };

      const unapprovedLogin = await request(app)
        .post('/api/auth/google')
        .send({ idToken: 'fake-token-2' });

      const unapprovedUserId = unapprovedLogin.body.user._id;

      // Generate API key for unapproved user directly via service
      const keyDoc = await ApiKeyService.createOrRegenerateApiKey(unapprovedUserId, 'Unapproved Key');
      const unapprovedApiKey = keyDoc.key;

      // Manually set isApproved to false in DB
      const user = await UserService.findById(unapprovedUserId);
      if (user) {
        user.isApproved = false;
        await user.save();
      }

      // Attempt to access agent endpoint
      const res = await request(app)
        .get('/api/agent/me')
        .set('x-api-key', unapprovedApiKey);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('not approved');
    });
  });

  describe('Agent Task Operations & Least Privilege Enforcement', () => {
    it('should create a user story with mandatory fields and default to active sprint/current user', async () => {
      const res = await request(app)
        .post('/api/agent/us')
        .set('x-api-key', adminApiKey)
        .send({
          title: 'Agent Task 1',
          description: 'Created by AI agent',
          storyPoints: 3,
          featureId: featureId,
          sprintId: sprintId
        });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Agent Task 1');
      expect(res.body.storyPoints).toBe(3);
      expect(res.body.featureId).toBe(featureId);
      expect(res.body.status).toBe('To Do');
    });

    it('should reject story creation if mandatory fields are missing', async () => {
      // Missing title
      const resNoTitle = await request(app)
        .post('/api/agent/us')
        .set('x-api-key', adminApiKey)
        .send({
          storyPoints: 3,
          featureId: featureId
        });
      expect(resNoTitle.status).toBe(400);

      // Missing story points
      const resNoPoints = await request(app)
        .post('/api/agent/us')
        .set('x-api-key', adminApiKey)
        .send({
          title: 'No points',
          featureId: featureId
        });
      expect(resNoPoints.status).toBe(400);

      // Missing featureId
      const resNoFeature = await request(app)
        .post('/api/agent/us')
        .set('x-api-key', adminApiKey)
        .send({
          title: 'No feature',
          storyPoints: 2
        });
      expect(resNoFeature.status).toBe(400);
    });

    it('should list user stories defaulting to current user in active sprint', async () => {
      // Create a story in active sprint assigned to admin
      await request(app)
        .post('/api/agent/us')
        .set('x-api-key', adminApiKey)
        .send({
          title: 'Active Story',
          storyPoints: 2,
          featureId: featureId,
          sprintId: sprintId
        });

      // Create a story in backlog
      await request(app)
        .post('/api/agent/us')
        .set('x-api-key', adminApiKey)
        .send({
          title: 'Backlog Story',
          storyPoints: 1,
          featureId: featureId
        });

      // Default GET /api/agent/us
      const resDefault = await request(app)
        .get('/api/agent/us')
        .set('x-api-key', adminApiKey);

      expect(resDefault.status).toBe(200);
      expect(resDefault.body.length).toBe(1);
      expect(resDefault.body[0].title).toBe('Active Story');

      // GET /api/agent/us?sprint=backlog
      const resBacklog = await request(app)
        .get('/api/agent/us?sprint=backlog')
        .set('x-api-key', adminApiKey);

      expect(resBacklog.status).toBe(200);
      expect(resBacklog.body.length).toBe(1);
      expect(resBacklog.body[0].title).toBe('Backlog Story');
    });

    it('should update story status and trigger status inheritance', async () => {
      const createRes = await request(app)
        .post('/api/agent/us')
        .set('x-api-key', adminApiKey)
        .send({
          title: 'Inheritance Task',
          storyPoints: 5,
          featureId: featureId,
          sprintId: sprintId
        });

      const storyId = createRes.body._id;

      // Update status to 'In Progress' via PATCH /api/agent/us/:id/status
      const patchRes = await request(app)
        .patch(`/api/agent/us/${storyId}/status`)
        .set('x-api-key', adminApiKey)
        .send({ status: 'In Progress' });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.status).toBe('In Progress');

      // Parent Feature should automatically be 'In Progress'
      const featureRes = await request(app)
        .get('/api/agent/feature')
        .set('x-api-key', adminApiKey);
      const feature = featureRes.body.find((f: any) => f._id === featureId);
      expect(feature.status).toBe('In Progress');

      // Grandparent Epic should automatically be 'In Progress'
      const epicRes = await request(app)
        .get('/api/agent/epic')
        .set('x-api-key', adminApiKey);
      const epic = epicRes.body.find((e: any) => e._id === epicId);
      expect(epic.status).toBe('In Progress');
    });

    it('should block attempts to modify protected fields or delete tasks (Least Privilege)', async () => {
      const createRes = await request(app)
        .post('/api/agent/us')
        .set('x-api-key', adminApiKey)
        .send({
          title: 'Protected Story',
          storyPoints: 3,
          featureId: featureId
        });

      const storyId = createRes.body._id;

      // Attempting to change title/points via status endpoint should return 403 Forbidden
      const patchForbidden = await request(app)
        .patch(`/api/agent/us/${storyId}/status`)
        .set('x-api-key', adminApiKey)
        .send({
          status: 'In Progress',
          title: 'Hacked Title',
          storyPoints: 99
        });
      expect(patchForbidden.status).toBe(403);

      // Full PUT should return 405 Method Not Allowed
      const putRes = await request(app)
        .put(`/api/agent/us/${storyId}`)
        .set('x-api-key', adminApiKey)
        .send({ title: 'Changed' });
      expect(putRes.status).toBe(405);

      // DELETE should return 405 Method Not Allowed
      const deleteRes = await request(app)
        .delete(`/api/agent/us/${storyId}`)
        .set('x-api-key', adminApiKey);
      expect(deleteRes.status).toBe(405);
    });

    it('should support read-only discovery endpoints', async () => {
      const epics = await request(app).get('/api/agent/epic').set('x-api-key', adminApiKey);
      expect(epics.status).toBe(200);
      expect(epics.body.length).toBeGreaterThan(0);

      const features = await request(app).get('/api/agent/feature').set('x-api-key', adminApiKey);
      expect(features.status).toBe(200);
      expect(features.body.length).toBeGreaterThan(0);

      const sprints = await request(app).get('/api/agent/sprints').set('x-api-key', adminApiKey);
      expect(sprints.status).toBe(200);
      expect(sprints.body.length).toBeGreaterThan(0);

      const users = await request(app).get('/api/agent/users').set('x-api-key', adminApiKey);
      expect(users.status).toBe(200);
      expect(users.body.length).toBeGreaterThan(0);
    });
  });

  describe('MCP SSE & JSON-RPC Protocol Support', () => {
    it('should establish SSE connection and return endpoint event', (done) => {
      const server = app.listen(0, () => {
        const port = (server.address() as any).port;
        const req = http.get(`http://localhost:${port}/api/mcp/sse`, {
          headers: { 'x-api-key': adminApiKey }
        }, (res) => {
          expect(res.statusCode).toBe(200);
          expect(res.headers['content-type']).toContain('text/event-stream');

          res.on('data', (chunk) => {
            const data = chunk.toString();
            expect(data).toContain('event: endpoint');
            expect(data).toContain('/api/mcp/messages?sessionId=');
            req.destroy();
            if (typeof server.closeAllConnections === 'function') {
              server.closeAllConnections();
            }
            server.close();
            done();
          });
        });
      });
    });

    it('should handle MCP initialize and tools/list requests', async () => {
      // 1. initialize
      const initRes = await request(app)
        .post('/api/mcp/messages')
        .set('x-api-key', adminApiKey)
        .send({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {}
        });

      expect(initRes.status).toBe(200);
      expect(initRes.body.result.serverInfo.name).toBe('mjolnir-mcp-server');

      // 2. tools/list
      const listRes = await request(app)
        .post('/api/mcp/messages')
        .set('x-api-key', adminApiKey)
        .send({
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/list',
          params: {}
        });

      expect(listRes.status).toBe(200);
      const tools = listRes.body.result.tools;
      expect(tools.length).toBe(9);
      const toolNames = tools.map((t: any) => t.name);
      expect(toolNames).toContain('mjolnir_list_user_stories');
      expect(toolNames).toContain('mjolnir_create_user_story');
      expect(toolNames).toContain('mjolnir_update_user_story_status');
      expect(toolNames).toContain('mjolnir_list_features');
      expect(toolNames).toContain('mjolnir_list_epics');
      expect(toolNames).toContain('mjolnir_get_active_sprint');
      expect(toolNames).toContain('mjolnir_list_team_members');
      expect(toolNames).toContain('mjolnir_get_current_user');
      expect(toolNames).toContain('mjolnir_get_user_story');
    });

    it('should execute MCP tool calls (create story, update status, list stories)', async () => {
      // Call mjolnir_create_user_story
      const createToolRes = await request(app)
        .post('/api/mcp/messages')
        .set('x-api-key', adminApiKey)
        .send({
          jsonrpc: '2.0',
          id: 10,
          method: 'tools/call',
          params: {
            name: 'mjolnir_create_user_story',
            arguments: {
              title: 'Story via MCP Tool',
              story_points: 3,
              feature_id: featureId,
              sprint_id: sprintId
            }
          }
        });

      expect(createToolRes.status).toBe(200);
      expect(createToolRes.body.result.isError).toBe(false);
      const createdData = JSON.parse(createToolRes.body.result.content[0].text);
      const createdStory = createdData.userStory || createdData;
      expect(createdStory.title).toBe('Story via MCP Tool');
      const newStoryId = createdStory._id;

      // Call mjolnir_update_user_story_status
      const updateToolRes = await request(app)
        .post('/api/mcp/messages')
        .set('x-api-key', adminApiKey)
        .send({
          jsonrpc: '2.0',
          id: 11,
          method: 'tools/call',
          params: {
            name: 'mjolnir_update_user_story_status',
            arguments: {
              id: newStoryId,
              status: 'In Progress'
            }
          }
        });

      expect(updateToolRes.status).toBe(200);
      expect(updateToolRes.body.result.isError).toBe(false);
      const updatedData = JSON.parse(updateToolRes.body.result.content[0].text);
      const updatedStory = updatedData.userStory || updatedData;
      expect(updatedStory.status).toBe('In Progress');

      // Call mjolnir_list_user_stories
      const listToolRes = await request(app)
        .post('/api/mcp/messages')
        .set('x-api-key', adminApiKey)
        .send({
          jsonrpc: '2.0',
          id: 12,
          method: 'tools/call',
          params: {
            name: 'mjolnir_list_user_stories',
            arguments: {
              sprint: 'active'
            }
          }
        });

      expect(listToolRes.status).toBe(200);
      const listData = JSON.parse(listToolRes.body.result.content[0].text);
      expect(listData.count).toBeGreaterThan(0);
      expect(listData.userStories.some((s: any) => s._id === newStoryId)).toBe(true);
    });
  });
});
