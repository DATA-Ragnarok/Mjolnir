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

describe('Sprint E2E Tests', () => {
  let token: string;

  beforeAll(async () => {
    await connectTestDB();
    token = await getAuthToken();
  });

  afterAll(async () => {
    await clearTestDB();
    await closeTestDB();
  });

  it('should create a new sprint', async () => {
    const response = await request(app)
      .post('/api/sprints')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Sprint 1',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe('Sprint 1');
  });

  it('should get all sprints', async () => {
    const response = await request(app)
      .get('/api/sprints')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should trigger sprint migration', async () => {
    // Create an expired sprint
    const expiredSprint = await request(app)
      .post('/api/sprints')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Expired Sprint',
        startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      });
    
    // Create a future sprint
    const futureSprint = await request(app)
      .post('/api/sprints')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Future Sprint',
        startDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      });

    // Create an epic and feature for the story
    const epicRes = await request(app)
      .post('/api/epics')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Migration Epic' });
    const featureRes = await request(app)
      .post('/api/features')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Migration Feature', epicId: epicRes.body._id });

    // Create an incomplete story in the expired sprint
    const storyRes = await request(app)
      .post('/api/user-stories')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Story to Migrate',
        featureId: featureRes.body._id,
        sprintId: expiredSprint.body._id,
        status: 'In Progress',
        storyPoints: 5
      });

    // Trigger migration
    const response = await request(app)
      .post('/api/sprints/migrate')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Sprint migration triggered successfully');

    // Check if story was migrated to the future sprint
    const updatedStoryRes = await request(app)
      .get(`/api/user-stories?sprintId=${futureSprint.body._id}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(updatedStoryRes.body.some((s: any) => s._id === storyRes.body._id)).toBe(true);
  });
});
