import request from 'supertest';
import { app } from '../index.js';

export const getAuthToken = async () => {
  const response = await request(app)
    .post('/api/auth/google')
    .send({ idToken: 'fake-token' });
  return response.body.token;
};
