import { api } from './api';

export const notificationsService = {
  getAll: async () => {
    const res = await api.get('/notifications');
    return res as any;
  },

  refresh: async () => {
    const res = await api.post('/notifications/refresh', {});
    return res as any;
  },

  markAsRead: async (id: string) => {
    const res = await api.patch(`/notifications/${id}/read`, {});
    return res as any;
  },

  markAllAsRead: async () => {
    const res = await api.patch('/notifications/mark-all-read', {});
    return res as any;
  },
};
