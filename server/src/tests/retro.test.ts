import request from 'supertest';
import { connectTestDB, clearTestDB, closeTestDB } from './testHelper.js';
import { jest } from '@jest/globals';

process.env['NODE_ENV'] = 'test';
jest.setTimeout(30000);

jest.unstable_mockModule('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: jest.fn().mockResolvedValue({
      getPayload: () => ({
        sub: 'test-google-id',
        email: 'test@example.com',
        name: 'Test User',
      }),
    }),
  })),
}));

const { app } = await import('../index.js');
const { getAuthToken } = await import('./authHelper.js');

describe('Retro E2E Tests', () => {
  let token: string;
  let currentSprintId: string;
  let previousSprintId: string;
  let featureId: string;

  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
    token = await getAuthToken();

    const sprint1Res = await request(app)
      .post('/api/sprints')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Sprint 1',
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-01-14T23:59:59.000Z',
      });
    previousSprintId = sprint1Res.body._id;

    const sprint2Res = await request(app)
      .post('/api/sprints')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Sprint 2',
        startDate: '2026-01-15T00:00:00.000Z',
        endDate: '2026-01-28T23:59:59.000Z',
      });
    currentSprintId = sprint2Res.body._id;

    const epicRes = await request(app)
      .post('/api/epics')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Retro Epic', status: 'To Do' });

    const featureRes = await request(app)
      .post('/api/features')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Retro Feature', epicId: epicRes.body._id, status: 'To Do' });

    featureId = featureRes.body._id;
  });

  afterAll(async () => {
    await closeTestDB();
  });

  it('requires authentication for retro routes', async () => {
    const response = await request(app).get('/api/retro/bootstrap');
    expect(response.status).toBe(401);
  });

  it('creates, lists, updates, and deletes a retro note', async () => {
    const createResponse = await request(app)
      .post('/api/retro/notes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'The good',
        description: 'Delivery quality improved',
        sprintId: currentSprintId,
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.title).toBe('The good');

    const listResponse = await request(app)
      .get(`/api/retro/notes?sprintId=${currentSprintId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(listResponse.status).toBe(200);
    expect(Array.isArray(listResponse.body)).toBe(true);
    expect(listResponse.body).toHaveLength(1);

    const noteId = listResponse.body[0]._id as string;

    const updateResponse = await request(app)
      .put(`/api/retro/notes/${noteId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'The better', description: 'Cycle time improved', sprintId: currentSprintId });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.title).toBe('The better');

    const deleteResponse = await request(app)
      .delete(`/api/retro/notes/${noteId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.message).toBe('Retro note deleted');
  });

  it('validates action item slot rules (exactly 3 and at least 2 filled)', async () => {
    const invalidLengthResponse = await request(app)
      .put(`/api/retro/action-items/${currentSprintId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ content: 'Only one' }],
      });

    expect(invalidLengthResponse.status).toBe(400);

    const invalidFilledResponse = await request(app)
      .put(`/api/retro/action-items/${currentSprintId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ content: 'One' }, { content: '' }, { content: '' }],
      });

    expect(invalidFilledResponse.status).toBe(400);

    const validResponse = await request(app)
      .put(`/api/retro/action-items/${currentSprintId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ content: 'Improve PR reviews' }, { content: 'Reduce blocked items' }, { content: '' }],
      });

    expect(validResponse.status).toBe(200);
    expect(Array.isArray(validResponse.body)).toBe(true);
    expect(validResponse.body).toHaveLength(3);
  });

  it('returns bootstrap data with current sprint id', async () => {
    const response = await request(app)
      .get('/api/retro/bootstrap')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.sprints)).toBe(true);
    expect(response.body.sprints.length).toBeGreaterThanOrEqual(2);
    expect(response.body.currentSprintId).toBeTruthy();
  });

  it('returns session data including previous sprint action items', async () => {
    await request(app)
      .put(`/api/retro/action-items/${previousSprintId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ content: 'Pair on blocked stories' }, { content: 'Smaller stories' }, { content: '' }],
      });

    await request(app)
      .post('/api/retro/notes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Bottleneck',
        description: 'Blocked waiting for review',
        sprintId: currentSprintId,
      });

    const response = await request(app)
      .get(`/api/retro/session/${currentSprintId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.previousSprint._id).toBe(previousSprintId);
    expect(Array.isArray(response.body.previousActionItems)).toBe(true);
    expect(response.body.previousActionItems.length).toBeGreaterThan(0);
    expect(Array.isArray(response.body.notes)).toBe(true);
    expect(response.body.stats).toBeDefined();
  });

  it('computes sprint stats response shape', async () => {
    const storyCreateResponse = await request(app)
      .post('/api/user-stories')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Implement API endpoint',
        featureId,
        sprintId: currentSprintId,
        storyPoints: 3,
        status: 'To Do',
      });

    const storyId = storyCreateResponse.body._id as string;

    await request(app)
      .put(`/api/user-stories/${storyId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'In Progress' });

    await request(app)
      .put(`/api/user-stories/${storyId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Blocked' });

    await request(app)
      .put(`/api/user-stories/${storyId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Done' });

    const statsResponse = await request(app)
      .get(`/api/retro/stats/${currentSprintId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(statsResponse.status).toBe(200);
    expect(typeof statsResponse.body.cycleTimeHours).toBe('number');
    expect(typeof statsResponse.body.throughput).toBe('number');
    expect(Array.isArray(statsResponse.body.blockedAging)).toBe(true);
  });
});
