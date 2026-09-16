import React from 'react';
import { CheckCircle2, Share2, Download, Printer, ArrowRight, MessageCircle, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { CurrencyText } from '../ui/CurrencyText';
import { ReceiptData } from '../../types';
import { paymentsService } from '../../services/payments.service';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: ReceiptData;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, receiptData }) => {
  if (!receiptData) return null;

  const handleWhatsAppShare = async () => {
    try {
      const waData = await paymentsService.getWhatsAppReceipt(receiptData.payment.id);
      window.open(waData.whatsappUrl, '_blank');
    } catch (err) {
      console.error('WhatsApp share error:', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Sudhakar Chits Receipt ${receiptData.receiptNumber}`,
          text: `Payment Receipt ${receiptData.receiptNumber} of ₹${receiptData.amount} for ${receiptData.member.name}`,
          url: `${window.location.origin}/api/documents/receipts/${receiptData.payment.id}/pdf`,
        });
      } catch (err) {
        console.log('Share canceled or not supported');
      }
    } else {
      handleWhatsAppShare();
    }
  };

  const handleDownloadPdf = () => {
    window.open(`/api/documents/receipts/${receiptData.payment.id}/pdf`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md">
      <div className="space-y-4">
        {/* Success Banner */}
        <div className="text-center pb-2">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2.5">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Payment Successful</h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">Receipt: {receiptData.receiptNumber}</p>
        </div>

        {/* Printable Receipt Paper Container */}
        <div id="printable-receipt" className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
          {/* Organization & Date */}
          <div className="flex justify-between items-start border-b border-slate-200/80 pb-2.5">
            <div>
              <div className="font-extrabold text-sm text-slate-900">Sudhakar Chits (India) Pvt Ltd</div>
              <div className="text-[11px] text-slate-500">Official Collection Receipt</div>
            </div>
            <div className="text-right font-mono text-[11px] text-slate-600">
              <div>{new Date(receiptData.date).toLocaleDateString('en-IN')}</div>
              <div className="text-slate-400">{new Date(receiptData.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>

          {/* Member & Chit info */}
          <div className="grid grid-cols-2 gap-2 text-slate-700">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Member</span>
              <span className="font-bold text-slate-900">{receiptData.member.name}</span>
              <div className="text-slate-500 text-[11px]">{receiptData.member.code} | {receiptData.member.phone}</div>
            </div>
            {receiptData.chit && (
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Chit Group</span>
                <span className="font-bold text-slate-900">{receiptData.chit.code}</span>
                <div className="text-slate-500 text-[11px]">{receiptData.chit.name}</div>
              </div>
            )}
          </div>

          {/* Allocation Breakdown Table */}
          <div className="border-t border-slate-200/80 pt-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Payment Allocation Breakdown
            </div>
            <div className="space-y-1 bg-white p-2.5 rounded-xl border border-slate-200/60">
              {receiptData.allocationBreakdown.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-600">
                    Month #{item.monthSequence} ({item.calendarMonth}/{item.calendarYear})
                  </span>
                  <div className="flex items-center gap-2">
                    {item.interestPaid > 0 && (
                      <span className="text-[10px] text-amber-600 font-medium">
                        Int: ₹{item.interestPaid}
                      </span>
                    )}
                    <span className="font-mono font-bold text-slate-900">
                      ₹{item.totalAllocated.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}

              {receiptData.advanceAmount > 0 && (
                <div className="flex items-center justify-between text-[11px] text-indigo-700 font-semibold pt-1 border-t border-slate-100">
                  <span>Credited to Member Advance</span>
                  <span className="font-mono font-bold">₹{receiptData.advanceAmount.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Total Amount & Mode */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Amount Collected</span>
              <span className="font-bold text-xs text-slate-600">Via {receiptData.paymentMode}</span>
            </div>
            <CurrencyText amount={receiptData.amount} size="2xl" variant="success" />
          </div>

          {/* Scheme Balance */}
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-900 flex justify-between font-semibold">
            <span>Remaining Scheme Balance:</span>
            <span>₹{receiptData.remainingChitBalance.toFixed(2)}</span>
          </div>

          {/* Collected By */}
          <div className="text-[10px] text-slate-400 text-center pt-1">
            Collected By: {receiptData.collectedBy.name} ({receiptData.collectedBy.role})
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleWhatsAppShare}
            leftIcon={<MessageCircle className="text-emerald-600" size={16} />}
          >
            WhatsApp
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            leftIcon={<Download size={16} />}
          >
            PDF Receipt
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNativeShare}
            leftIcon={<Share2 size={16} />}
            className="col-span-2 sm:col-span-1"
          >
            Share
          </Button>
        </div>

        {/* Continue Next Collection CTA */}
        <div className="pt-2">
          <Button size="lg" className="w-full" onClick={onClose} rightIcon={<ArrowRight size={18} />}>
            Continue to Next Collection
          </Button>
        </div>
      </div>
    </Modal>
  );
};
