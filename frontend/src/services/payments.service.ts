import { api } from './api';
import { Payment, ReceiptData, PaymentMode } from '../types';

export const paymentsService = {
  getAll: async (params?: { memberId?: string; chitId?: string; paymentMode?: PaymentMode; page?: number; limit?: number }) => {
    const res = await api.get('/payments', { params });
    return res as any;
  },

  getReceipt: async (paymentId: string): Promise<ReceiptData> => {
    const res = await api.get(`/payments/${paymentId}/receipt`);
    return res as any;
  },

  recordPayment: async (data: {
    memberId: string;
    chitId?: string;
    monthlyDueId?: string;
    amount: number;
    paymentMode: PaymentMode;
    referenceNumber?: string;
    notes?: string;
    idempotencyKey: string;
  }): Promise<ReceiptData> => {
    const res = await api.post('/payments', data);
    return res as any;
  },

  reversePayment: async (data: { paymentId: string; reason: string }): Promise<any> => {
    const res = await api.post('/reversals', data);
    return res as any;
  },

  getDueCalculation: async (dueId: string) => {
    const res = await api.get(`/ledger/due/${dueId}/calculate`);
    return res as any;
  },

  getWhatsAppReceipt: async (paymentId: string): Promise<{ recipientPhone: string; messageText: string; whatsappUrl: string }> => {
    const res = await api.get(`/communications/whatsapp/receipt/${paymentId}`);
    return res as any;
  },

  getWhatsAppReminder: async (memberId: string): Promise<{ recipientPhone: string; messageText: string; whatsappUrl: string }> => {
    const res = await api.get(`/communications/whatsapp/reminder/${memberId}`);
    return res as any;
  },
};
