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

// We must dynamically import the app AFTER the mock
const { app } = await import('../index.js');

describe('Auth E2E Tests', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  it('should authenticate a new user and make them admin if they are the first', async () => {
    const response = await request(app)
      .post('/api/auth/google')
      .send({ idToken: 'fake-token' });

    if (response.status !== 200) {
      console.log('Error Response:', response.body);
    }

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe('test@example.com');
    expect(response.body.user.isAdmin).toBe(true);
    expect(response.body.user.isApproved).toBe(true);
  });

  it('should return 401 for protected routes without token', async () => {
    const response = await request(app).get('/api/auth/me');
    expect(response.status).toBe(401);
  });

  it('should return current user with valid token', async () => {
    // First login to get token
    const loginRes = await request(app)
      .post('/api/auth/google')
      .send({ idToken: 'fake-token' });
    
    const token = loginRes.body.token;

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.email).toBe('test@example.com');
  });
});
