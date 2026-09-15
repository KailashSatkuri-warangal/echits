import { api } from './api';
import { Chit, ChitCardSummary } from '../types';

export const chitsService = {
  getAll: async (): Promise<ChitCardSummary[]> => {
    const res = await api.get('/chits');
    return res as any;
  },

  get360: async (id: string): Promise<{ chit: Chit; summary: ChitCardSummary; members: any[]; months: any[] }> => {
    const res = await api.get(`/chits/${id}/360`);
    return res as any;
  },

  create: async (data: Partial<Chit>): Promise<Chit> => {
    const res = await api.post('/chits', data);
    return res as any;
  },

  enrollMember: async (data: { chitId: string; memberId?: string; seatNumber: number; customInstallment?: number; openingBalance?: number; newMember?: any }): Promise<any> => {
    const res = await api.post('/memberships', data);
    return res as any;
  },
};
