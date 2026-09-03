import api from './api';
import { RetroActionItem, RetroNote, RetroSessionData, Sprint } from '../types';

export const retroService = {
  async getBootstrap() {
    const response = await api.get<{ sprints: Sprint[]; currentSprintId: string | null }>('/retro/bootstrap');
    return response.data;
  },

  async getNotesBySprint(sprintId: string) {
    const response = await api.get<RetroNote[]>('/retro/notes', { params: { sprintId } });
    return response.data;
  },

  async createNote(payload: { title: string; description: string; sprintId: string }) {
    const response = await api.post<RetroNote>('/retro/notes', payload);
    return response.data;
  },

  async updateNote(noteId: string, payload: { title: string; description: string; sprintId: string }) {
    const response = await api.put<RetroNote>(`/retro/notes/${noteId}`, payload);
    return response.data;
  },

  async deleteNote(noteId: string) {
    await api.delete(`/retro/notes/${noteId}`);
  },

  async getActionItemsBySprint(sprintId: string) {
    const response = await api.get<{
      sprintId: string;
      slots: string[];
      statuses: Array<'To Do' | 'Done'>;
      items: RetroActionItem[];
    }>('/retro/action-items', { params: { sprintId } });
    return response.data;
  },

  async saveActionItems(sprintId: string, items: Array<{ content: string; status?: 'To Do' | 'Done' }>) {
    const response = await api.put<RetroActionItem[]>(`/retro/action-items/${sprintId}`, { items });
    return response.data;
  },

  async getSessionData(sprintId: string) {
    const response = await api.get<RetroSessionData>(`/retro/session/${sprintId}`);
    return response.data;
  },
};
