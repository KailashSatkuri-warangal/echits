import { api } from './api';
import { Member, MemberSummary } from '../types';

export const membersService = {
  search: async (query: string): Promise<{ items: MemberSummary[]; total: number }> => {
    const res = await api.get('/members/search', { params: { q: query } });
    return res as any;
  },

  getAll: async (page = 1, limit = 20): Promise<{ items: MemberSummary[]; total: number; totalPages: number }> => {
    const res = await api.get('/members', { params: { page, limit } });
    return res as any;
  },

  get360: async (id: string): Promise<{ member: Member; summary: MemberSummary; memberships: any[]; paymentHistory: any[] }> => {
    const res = await api.get(`/members/${id}/360`);
    return res as any;
  },

  create: async (data: Partial<Member>): Promise<Member> => {
    const res = await api.post('/members', data);
    return res as any;
  },
};
