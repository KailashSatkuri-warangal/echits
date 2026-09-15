import React, { useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Phone,
  MessageCircle,
  IndianRupee,
  Layers,
  Calendar,
  UserCheck,
  ChevronLeft,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Download,
} from 'lucide-react';
import { membersService } from '../services/members.service';
import { paymentsService } from '../services/payments.service';
import { CurrencyText } from '../components/ui/CurrencyText';
import { StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { Modal } from '../components/ui/Modal';
import { ReceiptModal } from '../components/payments/ReceiptModal';

export const Member360Page: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { openPaymentDrawer } = useOutletContext<{ openPaymentDrawer: (params?: any) => void }>();

  const [activeTab, setActiveTab] = useState<'chits' | 'history' | 'profile'>('chits');
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [activeLedgerMembership, setActiveLedgerMembership] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['member360', id],
    queryFn: () => membersService.get360(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-slate-500">
        Member not found.{' '}
        <Button onClick={() => navigate('/members')} size="sm">
          Back to Directory
        </Button>
      </div>
    );
  }

  const { member, summary, memberships = [], paymentHistory = [] } = data;

  const handleCall = () => {
    window.open(`tel:${member.phone}`, '_self');
  };

  const handleWhatsApp = async () => {
    try {
      const wa = await paymentsService.getWhatsAppReminder(member.id);
      window.open(wa.whatsappUrl, '_blank');
    } catch (err) {
      const phone = member.phone.replace(/[^0-9]/g, '');
      const cleanPhone = phone.startsWith('91') ? phone : `91${phone}`;
      window.open(`https://wa.me/${cleanPhone}`, '_blank');
    }
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
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate('/members')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ChevronLeft size={16} />
        <span>Back to Members</span>
      </button>

      {/* Member 360 Header Profile Card */}
      <div className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200/90 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-xl flex items-center justify-center">
              {member.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900">{member.fullName}</h1>
                <StatusBadge status={member.status} size="sm" />
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                <span className="font-mono font-bold text-slate-700">{member.memberCode}</span>
                <span>•</span>
                <span className="font-mono">{member.phone}</span>
                {member.email && (
                  <>
                    <span>•</span>
                    <span>{member.email}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Communication Actions */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCall} leftIcon={<Phone size={15} />}>
              Call
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleWhatsApp}
              leftIcon={<MessageCircle className="text-emerald-600" size={15} />}
            >
              WhatsApp
            </Button>
            <Button
              size="sm"
              onClick={() => openPaymentDrawer({ memberId: member.id })}
              leftIcon={<IndianRupee size={15} />}
            >
              Record Payment
            </Button>
          </div>
        </div>

        {/* Multi-Chit Aggregated Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Chits</span>
            <div className="text-base font-black text-slate-900 mt-0.5">{summary.chitsCount} Chits</div>
            <span className="text-[10px] text-slate-500">{summary.pendingChitsCount} with pending dues</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Outstanding</span>
            <CurrencyText amount={summary.totalOutstanding} size="lg" variant={summary.totalOutstanding > 0 ? 'danger' : 'success'} />
            <span className="text-[10px] text-slate-500 block mt-0.5">Across all enrolled schemes</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Paid to Date</span>
            <CurrencyText amount={summary.totalPaid} size="lg" variant="success" />
            <span className="text-[10px] text-slate-500 block mt-0.5">Lifetime settled principal</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Interest Accrued</span>
            <CurrencyText amount={summary.totalInterest} size="lg" variant="warning" />
            <span className="text-[10px] text-slate-500 block mt-0.5">Overdue penalty balance</span>
          </div>
        </div>
      </div>

      {/* Segment Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('chits')}
          className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-colors ${
            activeTab === 'chits' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Chit Schemes ({memberships.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-colors ${
            activeTab === 'history' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Payment History ({paymentHistory.length})
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-colors ${
            activeTab === 'profile' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          KYC & Contact Details
        </button>
      </div>

      {/* TAB 1: Chit Memberships */}
      {activeTab === 'chits' && (
        <div className="space-y-4">
          {memberships.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border text-center text-slate-500 text-xs">
              This member is not yet enrolled in any chit scheme.
            </div>
          ) : (
            memberships.map((ms: any) => {
              const chitPending = (ms.dues || []).reduce(
                (sum: number, d: any) => sum + (parseFloat(d.balanceDue) || 0),
                0,
              );
              const chitPaid = (ms.dues || []).reduce(
                (sum: number, d: any) => sum + (parseFloat(d.totalPaid) || 0),
                0,
              );
              const isLifted = ms.status === 'LIFTED' || (ms.liftEvents && ms.liftEvents.length > 0);

              return (
                <div key={ms.id} className="bg-white rounded-2xl border border-slate-200/90 shadow-soft p-4 sm:p-5 space-y-3.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-slate-900 text-base">{ms.chit?.chitName}</h3>
                        <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                          {ms.chit?.chitCode}
                        </span>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          Seat #{ms.seatNumber}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Scheme Corpus: ₹{parseFloat(ms.chit?.totalValue).toLocaleString('en-IN')} • Monthly Due: ₹{parseFloat(ms.customInstallment || ms.chit?.defaultInstallment).toLocaleString('en-IN')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {isLifted && <StatusBadge status="LIFTED" size="sm" />}
                      <StatusBadge status={ms.status} size="sm" />
                    </div>
                  </div>

                  {/* Financial Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-slate-50 rounded-xl text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Pending Due</span>
                      <CurrencyText amount={chitPending} size="md" variant={chitPending > 0 ? 'danger' : 'success'} />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Paid Amount</span>
                      <CurrencyText amount={chitPaid} size="md" variant="success" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Joining Date</span>
                      <span className="font-mono text-slate-700 font-medium">{ms.joiningDate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Lift Status</span>
                      <span className="font-bold text-slate-800">{isLifted ? 'Auction Winner' : 'Non-Lifted'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveLedgerMembership(ms)}
                      leftIcon={<FileText size={14} />}
                    >
                      View Monthly Ledger ({ms.dues?.length || 0} Months)
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => openPaymentDrawer({ memberId: member.id, chitId: ms.chitId })}
                      leftIcon={<IndianRupee size={14} />}
                    >
                      Pay for Chit
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: Payment History */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-soft overflow-hidden divide-y divide-slate-100">
          {paymentHistory.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">No payment history recorded yet.</div>
          ) : (
            paymentHistory.map((p: any) => (
              <div key={p.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <Receipt size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono text-slate-900 text-sm">{p.receiptNumber}</span>
                      {p.isReversed && <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">REVERSED</span>}
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      {p.chit?.chitCode || 'Multi-Chit'} • Via {p.paymentMode} • {new Date(p.collectedAt).toLocaleDateString('en-IN')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <CurrencyText amount={p.totalAmount} size="md" variant={p.isReversed ? 'muted' : 'success'} />
                    <div className="text-[10px] text-slate-400">By {p.collectedByUser?.name}</div>
                  </div>

                  <Button variant="outline" size="sm" onClick={() => handleViewReceipt(p.id)}>
                    Receipt
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: Profile Details */}
      {activeTab === 'profile' && (
        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-soft space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900">Personal & KYC Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Full Name</span>
              <span className="font-bold text-slate-900 text-sm">{member.fullName}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Mobile Phone</span>
              <span className="font-mono text-slate-800 font-bold">{member.phone}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Alternate Phone</span>
              <span className="font-mono text-slate-800">{member.altPhone || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Email</span>
              <span className="text-slate-800">{member.email || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Residential Address</span>
              <span className="text-slate-800">{member.address || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">ID Proof</span>
              <span className="font-mono font-bold text-slate-900">{member.idProofType}: {member.idProofNumber || 'Not submitted'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Ledger Modal for Selected Membership */}
      {activeLedgerMembership && (
        <Modal
          isOpen={!!activeLedgerMembership}
          onClose={() => setActiveLedgerMembership(null)}
          title={`Monthly Ledger: ${activeLedgerMembership.chit?.chitCode}`}
          subtitle={`Member: ${member.fullName} (Seat #${activeLedgerMembership.seatNumber})`}
          maxWidth="2xl"
        >
          <div className="space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-2.5">Month</th>
                    <th className="p-2.5">Due Date</th>
                    <th className="p-2.5 text-right">Inst.</th>
                    <th className="p-2.5 text-right">Prev Bal</th>
                    <th className="p-2.5 text-right">Interest</th>
                    <th className="p-2.5 text-right">Total Due</th>
                    <th className="p-2.5 text-right">Paid</th>
                    <th className="p-2.5 text-right">Balance</th>
                    <th className="p-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {activeLedgerMembership.dues?.map((due: any) => (
                    <tr key={due.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900">#{due.chitMonth?.monthSequence}</td>
                      <td className="p-2.5 font-mono text-slate-600">{due.chitMonth?.dueDate}</td>
                      <td className="p-2.5 text-right font-mono">₹{parseFloat(due.scheduledDue).toFixed(0)}</td>
                      <td className="p-2.5 text-right font-mono text-slate-500">₹{parseFloat(due.previousBalance).toFixed(0)}</td>
                      <td className="p-2.5 text-right font-mono text-amber-600">
                        {parseFloat(due.interestAmount) > 0 ? `₹${parseFloat(due.interestAmount).toFixed(0)}` : '-'}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">₹{parseFloat(due.totalDue).toFixed(0)}</td>
                      <td className="p-2.5 text-right font-mono text-emerald-700">₹{parseFloat(due.totalPaid).toFixed(0)}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-rose-600">₹{parseFloat(due.balanceDue).toFixed(0)}</td>
                      <td className="p-2.5 text-center">
                        <StatusBadge status={due.status} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 flex justify-end">
              <Button size="sm" onClick={() => setActiveLedgerMembership(null)}>
                Close Ledger
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          receiptData={selectedReceipt}
        />
      )}
    </div>
  );
};
