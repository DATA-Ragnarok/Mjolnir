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

describe('Feature E2E Tests', () => {
  let token: string;
  let epicId: string;

  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
    token = await getAuthToken();
    
    // Create an epic to link features to
    const epicRes = await request(app)
      .post('/api/epics')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Epic for Features' });
    epicId = epicRes.body._id;
  });

  afterAll(async () => {
    await closeTestDB();
  });

  it('should create a new feature', async () => {
    const response = await request(app)
      .post('/api/features')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Feature',
        epicId: epicId,
      });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe('Test Feature');
    expect(response.body.epicId).toBe(epicId);
  });

  it('should get features for an epic', async () => {
    const response = await request(app)
      .get(`/api/features?epicId=${epicId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    // Note: epics are joined so epicId is checked on the resulting object
    expect(response.body.every((f: any) => f.epicId === epicId)).toBe(true);
  });

  it('should get features with progress metrics', async () => {
    // 1. Create a feature
    const featureRes = await request(app)
      .post('/api/features')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Feature with Progress', epicId });
    const featureId = featureRes.body._id;

    // 2. Create user stories
    await request(app)
      .post('/api/user-stories')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Story 1', featureId, storyPoints: 5, status: 'Done' });

    await request(app)
      .post('/api/user-stories')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Story 2', featureId, storyPoints: 3, status: 'In Progress' });

    // 3. Get features and verify progress
    const response = await request(app)
      .get(`/api/features?epicId=${epicId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    const feature = response.body.find((f: any) => f._id === featureId);
    expect(feature).toBeDefined();
    expect(feature.userStoryCount).toBe(2);
    expect(feature.totalStoryPoints).toBe(8);
    expect(feature.completedStoryPoints).toBe(5);
    expect(feature.epicTitle).toBe('Epic for Features');
  });

  it('should update a feature', async () => {
    const createRes = await request(app)
      .post('/api/features')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Feature to Update', epicId });
    
    const featureId = createRes.body._id;

    const response = await request(app)
      .put(`/api/features/${featureId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated Feature Title' });

    expect(response.status).toBe(200);
    expect(response.body.title).toBe('Updated Feature Title');
  });

  it('should delete a feature', async () => {
    const createRes = await request(app)
      .post('/api/features')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Feature to Delete', epicId });
    
    const featureId = createRes.body._id;

    const response = await request(app)
      .delete(`/api/features/${featureId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Feature deleted');
  });
});
