import { api } from './api';
import { User } from '../types';

export const authService = {
  login: async (email: string, pass: string): Promise<{ accessToken: string; user: User }> => {
    const res = await api.post('/auth/login', { email, password: pass });
    return res as any;
  },

  getProfile: async (): Promise<User> => {
    const res = await api.get('/auth/me');
    return res as any;
  },
};
