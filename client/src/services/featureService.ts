import api from './api';
import { Feature } from '../types';

export const featureService = {
  getFeatures: async (epicId?: string): Promise<Feature[]> => {
    const params = epicId ? { epicId } : {};
    const response = await api.get('/features', { params });
    return response.data;
  },

  createFeature: async (data: Partial<Feature>): Promise<Feature> => {
    const response = await api.post('/features', data);
    return response.data;
  },

  updateFeature: async (id: string, data: Partial<Feature>): Promise<Feature> => {
    const response = await api.put(`/features/${id}`, data);
    return response.data;
  },

  deleteFeature: async (id: string): Promise<void> => {
    await api.delete(`/features/${id}`);
  },
};
