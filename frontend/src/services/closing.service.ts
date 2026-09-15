import { api } from './api';

export const closingService = {
  getToday: async () => {
    const res = await api.get('/daily-closing/today');
    return res as any;
  },

  getForDate: async (date: string) => {
    const res = await api.get(`/daily-closing/${date}`);
    return res as any;
  },

  getHistory: async () => {
    const res = await api.get('/daily-closing/history');
    return res as any;
  },

  reconcile: async (date: string, actualClosing: number, notes?: string) => {
    const res = await api.post(`/daily-closing/${date}/reconcile`, { actualClosing, notes });
    return res as any;
  },
};
