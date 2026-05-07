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

describe('Epic E2E Tests', () => {
  let token: string;

  beforeAll(async () => {
    await connectTestDB();
    token = await getAuthToken();
  });

  afterAll(async () => {
    await clearTestDB();
    await closeTestDB();
  });

  it('should create a new epic', async () => {
    const response = await request(app)
      .post('/api/epics')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Epic',
        description: 'Test Description',
      });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe('Test Epic');
    expect(response.body._id).toBeDefined();
  });

  it('should get all epics', async () => {
    const response = await request(app)
      .get('/api/epics')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('should update an epic', async () => {
    const createRes = await request(app)
      .post('/api/epics')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Epic to Update' });
    
    const epicId = createRes.body._id;

    const response = await request(app)
      .put(`/api/epics/${epicId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated Epic Title' });

    expect(response.status).toBe(200);
    expect(response.body.title).toBe('Updated Epic Title');
  });

  it('should delete an epic', async () => {
    const createRes = await request(app)
      .post('/api/epics')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Epic to Delete' });
    
    const epicId = createRes.body._id;

    const response = await request(app)
      .delete(`/api/epics/${epicId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Epic deleted');

    const getRes = await request(app)
      .get('/api/epics')
      .set('Authorization', `Bearer ${token}`);
    
    expect(getRes.body.some((e: any) => e._id === epicId)).toBe(false);
  });
});
