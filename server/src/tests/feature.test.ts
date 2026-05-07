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
    expect(response.body.every((f: any) => f.epicId === epicId)).toBe(true);
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
