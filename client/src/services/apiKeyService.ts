import api from './api';
import { ApiKeyInfo } from '../types';

export const apiKeyService = {
  getApiKey: async (): Promise<ApiKeyInfo | null> => {
    const response = await api.get('/auth/api-key');
    return response.data.apiKey;
  },

  generateApiKey: async (name: string = 'Agent Integration Key'): Promise<ApiKeyInfo> => {
    const response = await api.post('/auth/api-key', { name });
    return response.data.apiKey;
  }
};
