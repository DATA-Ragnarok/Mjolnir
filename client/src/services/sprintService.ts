import api from './api';
import { Sprint } from '../types';

export const sprintService = {
  getSprints: async (): Promise<Sprint[]> => {
    const response = await api.get('/sprints');
    return response.data;
  },

  createSprint: async (data: Partial<Sprint>): Promise<Sprint> => {
    const response = await api.post('/sprints', data);
    return response.data;
  },

  updateSprint: async (id: string, data: Partial<Sprint>): Promise<Sprint> => {
    const response = await api.put(`/sprints/${id}`, data);
    return response.data;
  },

  deleteSprint: async (id: string): Promise<void> => {
    await api.delete(`/sprints/${id}`);
  },

  migrateSprints: async (): Promise<void> => {
    await api.post('/sprints/migrate');
  },
};
