import api from './api';
import { UserStory } from '../types';

export const userStoryService = {
  getUserStories: async (featureId?: string, sprintId?: string): Promise<UserStory[]> => {
    const params: any = {};
    if (featureId) params.featureId = featureId;
    if (sprintId) params.sprintId = sprintId;
    const response = await api.get('/user-stories', { params });
    return response.data;
  },

  createUserStory: async (data: Partial<UserStory>): Promise<UserStory> => {
    const response = await api.post('/user-stories', data);
    return response.data;
  },

  updateUserStory: async (id: string, data: Partial<UserStory>): Promise<UserStory> => {
    const response = await api.put(`/user-stories/${id}`, data);
    return response.data;
  },

  deleteUserStory: async (id: string): Promise<void> => {
    await api.delete(`/user-stories/${id}`);
  },
};
