import { api } from './api';
import { DashboardKpis } from '../types';

export const reportsService = {
  getDashboardKpis: async (): Promise<DashboardKpis> => {
    const res = await api.get('/reports/dashboard-kpis');
    return res as any;
  },

  getDailyCollection: async (startDate?: string, endDate?: string) => {
    const res = await api.get('/reports/daily-collection', { params: { startDate, endDate } });
    return res as any;
  },

  getChitWise: async () => {
    const res = await api.get('/reports/chit-wise');
    return res as any;
  },

  getOverdueAgeing: async () => {
    const res = await api.get('/reports/overdue-ageing');
    return res as any;
  },
};
