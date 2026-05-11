import api from './api';
import { User } from '../types';

export const userService = {
  getApprovedUsers: async (): Promise<User[]> => {
    const response = await api.get('/users/approved');
    return response.data;
  },
};
