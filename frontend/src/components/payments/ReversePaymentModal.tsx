import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Undo2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { paymentsService } from '../../services/payments.service';

interface ReversePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: any;
}

export const ReversePaymentModal: React.FC<ReversePaymentModalProps> = ({
  isOpen,
  onClose,
  payment,
}) => {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');

  const reverseMutation = useMutation({
    mutationFn: () => paymentsService.reversePayment({ paymentId: payment.id, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['member360'] });
      queryClient.invalidateQueries({ queryKey: ['chits'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardKpis'] });
      onClose();
    },
  });

  if (!payment) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reverse / Void Payment"
      subtitle={`Receipt #${payment.receiptNumber}`}
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex gap-3 text-rose-800 text-xs">
          <AlertTriangle className="text-rose-600 shrink-0" size={20} />
          <div>
            <span className="font-bold block">Financial Reversal Warning:</span>
            This action will unwind payment allocations, restore unpaid ledger balances, and record an immutable audit entry.
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Member:</span>
            <span className="font-bold text-slate-800">{payment.member?.fullName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Amount:</span>
            <span className="font-bold text-slate-900">₹{parseFloat(payment.totalAmount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Mode:</span>
            <span className="font-medium text-slate-800">{payment.paymentMode}</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Mandatory Reversal Reason *
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="State why this payment is being voided (e.g., bounced cheque, staff entry error, member cancellation)..."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={() => reverseMutation.mutate()}
            isLoading={reverseMutation.isPending}
            disabled={!reason.trim()}
            leftIcon={<Undo2 size={16} />}
          >
            Confirm Reversal
          </Button>
        </div>
      </div>
    </Modal>
  );
};
