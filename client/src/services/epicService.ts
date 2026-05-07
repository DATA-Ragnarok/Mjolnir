import api from './api';
import { Epic, EpicWithProgress } from '../types';

export const epicService = {
  getEpics: async (): Promise<EpicWithProgress[]> => {
    const response = await api.get('/epics');
    return response.data;
  },

  createEpic: async (data: Partial<Epic>): Promise<Epic> => {
    const response = await api.post('/epics', data);
    return response.data;
  },

  updateEpic: async (id: string, data: Partial<Epic>): Promise<Epic> => {
    const response = await api.put(`/epics/${id}`, data);
    return response.data;
  },

  deleteEpic: async (id: string): Promise<void> => {
    await api.delete(`/epics/${id}`);
  },
};
