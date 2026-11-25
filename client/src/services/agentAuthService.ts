import api from './api';

export type AgentSessionInfo = {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt?: string;
  expiresAt: string;
};

export const agentAuthService = {
  lookupCode: async (code: string): Promise<boolean> => {
    const response = await api.get('/agent/auth/lookup', { params: { code } });
    return response.data.valid;
  },

  approve: async (code: string): Promise<void> => {
    await api.post('/agent/auth/approve', { code });
  },

  deny: async (code: string): Promise<void> => {
    await api.post('/agent/auth/deny', { code });
  },

  listSessions: async (): Promise<AgentSessionInfo[]> => {
    const response = await api.get('/agent/auth/sessions');
    return response.data;
  },

  revokeSession: async (id: string): Promise<void> => {
    await api.delete(`/agent/auth/sessions/${id}`);
  },
};
