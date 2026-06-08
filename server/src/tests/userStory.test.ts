import request from 'supertest';
import { connectTestDB, clearTestDB, closeTestDB } from './testHelper.js';
import { jest } from '@jest/globals';

// Mock google-auth-library
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

describe('UserStory E2E Tests', () => {
  let token: string;
  let epicId: string;
  let featureId: string;

  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
    token = await getAuthToken();
    
    const epicRes = await request(app)
      .post('/api/epics')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Grandparent Epic', status: 'To Do' });
    epicId = epicRes.body._id;

    const featureRes = await request(app)
      .post('/api/features')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Parent Feature', epicId, status: 'To Do' });
    featureId = featureRes.body._id;
  });

  afterAll(async () => {
    await closeTestDB();
  });

  it('should create a new user story', async () => {
    const response = await request(app)
      .post('/api/user-stories')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Story',
        featureId,
        storyPoints: 5,
        status: 'To Do'
      });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe('Test Story');
  });

  it('should trigger status inheritance when story moves to In Progress', async () => {
    const storyRes = await request(app)
      .post('/api/user-stories')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Inheritance Story', featureId, storyPoints: 1, status: 'To Do' });
    
    const storyId = storyRes.body._id;

    // Move to In Progress
    await request(app)
      .put(`/api/user-stories/${storyId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'In Progress' });

    // Check Feature
    const featureRes = await request(app)
      .get('/api/features')
      .set('Authorization', `Bearer ${token}`);
    const feature = featureRes.body.find((f: any) => f._id === featureId);
    expect(feature.status).toBe('In Progress');

    // Check Epic
    const epicRes = await request(app)
      .get('/api/epics')
      .set('Authorization', `Bearer ${token}`);
    const epic = epicRes.body.find((e: any) => e._id === epicId);
    expect(epic.status).toBe('In Progress');
  });

  it('should trigger completion inheritance when all stories are Done', async () => {
    // Clear stories for this feature first
    const existingStories = await request(app)
      .get(`/api/user-stories?featureId=${featureId}`)
      .set('Authorization', `Bearer ${token}`);
    
    for (const s of existingStories.body) {
      await request(app)
        .delete(`/api/user-stories/${s._id}`)
        .set('Authorization', `Bearer ${token}`);
    }

    // Create 2 stories
    const s1 = await request(app)
      .post('/api/user-stories')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Story 1', featureId, storyPoints: 1, status: 'To Do' });
    
    const s2 = await request(app)
      .post('/api/user-stories')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Story 2', featureId, storyPoints: 1, status: 'To Do' });

    // Mark s1 as Done
    await request(app)
      .put(`/api/user-stories/${s1.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Done' });

    // Feature should still be 'In Progress' (if it was) or 'To Do'
    let featureRes = await request(app)
      .get('/api/features')
      .set('Authorization', `Bearer ${token}`);
    let feature = featureRes.body.find((f: any) => f._id === featureId);
    expect(feature.status).not.toBe('Done');

    // Mark s2 as Done
    await request(app)
      .put(`/api/user-stories/${s2.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Done' });

    // Feature should now be 'Done'
    featureRes = await request(app)
      .get('/api/features')
      .set('Authorization', `Bearer ${token}`);
    feature = featureRes.body.find((f: any) => f._id === featureId);
    expect(feature.status).toBe('Done');
  });

  it('should get all user stories', async () => {
    await request(app)
      .post('/api/user-stories')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Initial Story', featureId, storyPoints: 1 });

    const response = await request(app)
      .get('/api/user-stories')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('should delete a user story', async () => {
    const createRes = await request(app)
      .post('/api/user-stories')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Story to Delete',
        featureId,
        storyPoints: 1
      });
    
    const storyId = createRes.body._id;

    const response = await request(app)
      .delete(`/api/user-stories/${storyId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('User story deleted');
  });
});
