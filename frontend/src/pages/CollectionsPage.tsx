import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import {
  WalletCards,
  Clock,
  AlertTriangle,
  History,
  Phone,
  MessageCircle,
  IndianRupee,
  Search,
  Receipt,
  Undo2,
  FileText,
} from 'lucide-react';
import { membersService } from '../services/members.service';
import { paymentsService } from '../services/payments.service';
import { CurrencyText } from '../components/ui/CurrencyText';
import { StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ReceiptModal } from '../components/payments/ReceiptModal';
import { ReversePaymentModal } from '../components/payments/ReversePaymentModal';
import { useAuth } from '../context/AuthContext';
import { MemberSummary } from '../types';

export const CollectionsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'due-today';
  const { openPaymentDrawer } = useOutletContext<{ openPaymentDrawer: (params?: any) => void }>();
  const { isAdmin } = useAuth();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [reversingPayment, setReversingPayment] = useState<any>(null);

  // Fetch all members summaries for dues evaluation
  const { data: membersData, isLoading: isMembersLoading } = useQuery({
    queryKey: ['members'],
    queryFn: () => membersService.getAll(1, 100),
  });

  // Fetch payments history
  const { data: paymentsData, isLoading: isPaymentsLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: () => paymentsService.getAll({ page: 1, limit: 50 }),
  });

  const members: MemberSummary[] = membersData?.items || [];
  const payments = paymentsData?.items || [];

  // Filter dues
  const dueTodayMembers = members.filter((m) => {
    return m.totalOutstanding > 0 && m.chits.some((c) => c.pendingAmount > 0);
  });

  const overdueMembers = members.filter((m) => m.totalOverdue > 0);
  const pendingMembers = members.filter((m) => m.totalOutstanding > 0);

  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleWhatsApp = (phone: string, memberName: string, amount: number) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const intlPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const text = encodeURIComponent(
      `Hello ${memberName}, this is a collection reminder from eChits. You have an outstanding chit balance of ₹${amount.toLocaleString('en-IN')}. Please confirm payment time. Thank you!`,
    );
    window.open(`https://wa.me/${intlPhone}?text=${text}`, '_blank');
  };

  const handleViewReceipt = async (paymentId: string) => {
    try {
      const rec = await paymentsService.getReceipt(paymentId);
      setSelectedReceipt(rec);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Collections Workbench</h1>
          <p className="text-xs text-slate-500 font-medium">Fast payment collection, due lists, and transaction history</p>
        </div>

        <Button
          onClick={() => openPaymentDrawer()}
          leftIcon={<IndianRupee size={16} />}
        >
          Quick Payment Entry
        </Button>
      </div>

      {/* Segmented Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/60 rounded-2xl overflow-x-auto">
        <button
          onClick={() => setTab('due-today')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'due-today' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock size={15} className="text-blue-500" />
          <span>Due Today ({dueTodayMembers.length})</span>
        </button>

        <button
          onClick={() => setTab('overdue')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'overdue' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <AlertTriangle size={15} className="text-rose-500" />
          <span>Overdue ({overdueMembers.length})</span>
        </button>

        <button
          onClick={() => setTab('pending')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'pending' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <WalletCards size={15} className="text-amber-500" />
          <span>All Pending ({pendingMembers.length})</span>
        </button>

        <button
          onClick={() => setTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <History size={15} className="text-emerald-600" />
          <span>Collection History</span>
        </button>
      </div>

      {/* TAB CONTENT */}
      {activeTab !== 'history' ? (
        <div className="space-y-3">
          {isMembersLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (activeTab === 'due-today' ? dueTodayMembers : activeTab === 'overdue' ? overdueMembers : pendingMembers).length === 0 ? (
            <EmptyState
              icon={<Clock size={32} />}
              title="No collection records in this category"
              description="All member accounts under this filter are settled."
            />
          ) : (
            (activeTab === 'due-today' ? dueTodayMembers : activeTab === 'overdue' ? overdueMembers : pendingMembers).map((m) => (
              <div
                key={m.id}
                className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-sm">{m.fullName}</span>
                    <span className="text-[10px] font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                      {m.memberCode}
                    </span>
                    {m.pendingChitsCount > 1 && (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                        {m.pendingChitsCount} Chits Pending
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">{m.phone} • {m.address || 'Address on file'}</div>

                  {/* Chit Schemes pending list */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {m.chits.filter((c) => c.pendingAmount > 0).map((c) => (
                      <span key={c.chitId} className="text-[11px] font-medium bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg text-slate-700">
                        {c.chitCode}: <strong className="text-slate-900">₹{c.pendingAmount.toLocaleString('en-IN')}</strong>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Total Due</div>
                    <CurrencyText amount={m.totalOutstanding} size="lg" variant="danger" />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCall(m.phone)}
                      className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700"
                      title="Call"
                    >
                      <Phone size={15} />
                    </button>
                    <button
                      onClick={() => handleWhatsApp(m.phone, m.fullName, m.totalOutstanding)}
                      className="p-2.5 rounded-xl border border-slate-200 hover:bg-emerald-50 text-emerald-600"
                      title="WhatsApp Reminder"
                    >
                      <MessageCircle size={15} />
                    </button>
                    <Button
                      size="sm"
                      onClick={() => openPaymentDrawer({ memberId: m.id })}
                      leftIcon={<IndianRupee size={14} />}
                    >
                      Collect
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* HISTORY TAB */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-soft overflow-hidden divide-y divide-slate-100">
          {isPaymentsLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : payments.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">No payment history recorded yet.</div>
          ) : (
            payments.map((p: any) => (
              <div key={p.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <Receipt size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{p.member?.fullName}</span>
                      <span className="font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                        {p.receiptNumber}
                      </span>
                      {p.isReversed && (
                        <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">
                          REVERSED
                        </span>
                      )}
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      {p.chit?.chitCode || 'Multi-Chit'} • Mode: {p.paymentMode} • Date: {new Date(p.collectedAt).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <CurrencyText amount={p.totalAmount} size="md" variant={p.isReversed ? 'muted' : 'success'} />
                    <div className="text-[10px] text-slate-400">By {p.collectedByUser?.name}</div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="sm" onClick={() => handleViewReceipt(p.id)}>
                      Receipt
                    </Button>
                    {!p.isReversed && isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReversingPayment(p)}
                        className="text-rose-600 hover:bg-rose-50"
                        title="Reverse / Void"
                      >
                        <Undo2 size={15} />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          receiptData={selectedReceipt}
        />
      )}

      {/* Reversal Modal */}
      {reversingPayment && (
        <ReversePaymentModal
          isOpen={!!reversingPayment}
          onClose={() => setReversingPayment(null)}
          payment={reversingPayment}
        />
      )}
    </div>
  );
};
