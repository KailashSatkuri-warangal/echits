import React, { useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Layers,
  Users,
  Calendar,
  IndianRupee,
  UserPlus,
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { chitsService } from '../services/chits.service';
import { CurrencyText } from '../components/ui/CurrencyText';
import { StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { EnrollMemberModal } from '../components/chits/EnrollMemberModal';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';

export const Chit360Page: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { openPaymentDrawer } = useOutletContext<{ openPaymentDrawer: (params?: any) => void }>();

  const [activeTab, setActiveTab] = useState<'members' | 'monthly-grid' | 'auctions'>('members');
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [selectedLedgerMember, setSelectedLedgerMember] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['chit360', id],
    queryFn: () => chitsService.get360(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-slate-500">
        Chit not found.{' '}
        <Button onClick={() => navigate('/chits')} size="sm">
          Back to Chits
        </Button>
      </div>
    );
  }

  const { chit, summary, members = [], months = [] } = data;
  const nextSeat = members.length + 1;
  const isFull = members.length >= chit.capacity;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate('/chits')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ChevronLeft size={16} />
        <span>Back to All Chits</span>
      </button>

      {/* Chit 360 Header Profile Card */}
      <div className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200/90 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">{chit.chitName}</h1>
              <span className="text-xs font-bold font-mono bg-slate-100 px-2.5 py-0.5 rounded text-slate-700">
                {chit.chitCode}
              </span>
              <StatusBadge status={chit.status} size="sm" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Duration: {chit.durationMonths} Months • Due Day: {chit.dueDay}th of every month • Grace Period: {chit.gracePeriodDays} days
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isFull && isAdmin && (
              <Button size="sm" onClick={() => setIsEnrollOpen(true)} leftIcon={<UserPlus size={15} />}>
                Enroll Member ({members.length}/{chit.capacity})
              </Button>
            )}
          </div>
        </div>

        {/* Scheme Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Corpus</span>
            <CurrencyText amount={chit.totalValue} size="lg" showDecimals={false} />
            <span className="text-[10px] text-slate-500 block mt-0.5">₹{Number(chit.defaultInstallment).toFixed(0)}/seat/mo</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Collected</span>
            <CurrencyText amount={summary.totalCollected} size="lg" variant="success" />
            <span className="text-[10px] text-slate-500 block mt-0.5">Of ₹{summary.totalExpected.toLocaleString('en-IN')} target</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Pending Dues</span>
            <CurrencyText amount={summary.totalPending} size="lg" variant={summary.totalPending > 0 ? 'danger' : 'success'} />
            <span className="text-[10px] text-slate-500 block mt-0.5">Outstanding from members</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Capacity & Status</span>
            <div className="text-base font-bold text-slate-900 mt-0.5">
              {members.length} / {chit.capacity} Seats
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
              {isFull ? 'Scheme Full' : `${chit.capacity - members.length} Vacant`}
            </span>
          </div>
        </div>
      </div>

      {/* Segment Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-colors ${
            activeTab === 'members' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Enrolled Member Seats ({members.length})
        </button>
        <button
          onClick={() => setActiveTab('monthly-grid')}
          className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-colors ${
            activeTab === 'monthly-grid' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Monthly Collection Grid ({months.length} Months)
        </button>
        <button
          onClick={() => setActiveTab('auctions')}
          className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-colors ${
            activeTab === 'auctions' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Lift & Auction History
        </button>
      </div>

      {/* TAB 1: Enrolled Seats */}
      {activeTab === 'members' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-soft overflow-hidden divide-y divide-slate-100">
          {members.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No members enrolled yet.{' '}
              {isAdmin && (
                <button onClick={() => setIsEnrollOpen(true)} className="text-emerald-600 font-bold underline ml-1">
                  Enroll Seat #1
                </button>
              )}
            </div>
          ) : (
            members.map((m: any) => (
              <div key={m.membershipId} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 font-bold text-slate-800 flex items-center justify-center font-mono">
                    #{m.seatNumber}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{m.fullName}</span>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {m.memberCode}
                      </span>
                      {m.isLifted && <StatusBadge status="LIFTED" size="sm" />}
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      {m.phone} • Monthly Installment: ₹{parseFloat(m.monthlyInstallment).toFixed(0)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Pending Due</div>
                    <CurrencyText amount={m.totalPending} size="sm" variant={m.totalPending > 0 ? 'danger' : 'success'} />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedLedgerMember(m)}
                      leftIcon={<FileText size={14} />}
                    >
                      Ledger
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => openPaymentDrawer({ memberId: m.memberId, chitId: chit.id })}
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
      )}

      {/* TAB 2: Monthly Collection Grid */}
      {activeTab === 'monthly-grid' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Seq</th>
                  <th className="p-3">Period</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3">Grace Date</th>
                  <th className="p-3 text-right">Expected</th>
                  <th className="p-3 text-right">Collected</th>
                  <th className="p-3 text-right">Pending</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {months.map((m: any) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-900">Month #{m.monthSequence}</td>
                    <td className="p-3">{m.calendarMonth}/{m.calendarYear}</td>
                    <td className="p-3 font-mono text-slate-600">{m.dueDate}</td>
                    <td className="p-3 font-mono text-slate-600">{m.graceDate}</td>
                    <td className="p-3 text-right font-mono">₹{m.expected.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700">₹{m.collected.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-mono font-bold text-rose-600">₹{m.pending.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-center">
                      <StatusBadge status={m.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Lift / Auction History */}
      {activeTab === 'auctions' && (
        <div className="space-y-3">
          {members.filter((m: any) => m.isLifted).length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border text-center text-slate-400 text-xs">
              No auction lift events recorded for this chit group yet.
            </div>
          ) : (
            members
              .filter((m: any) => m.isLifted)
              .map((m: any) => (
                <div key={m.membershipId} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-soft space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserCheck className="text-emerald-600" size={18} />
                      <span className="font-bold text-slate-900">{m.fullName}</span>
                      <span className="text-slate-500">Seat #{m.seatNumber}</span>
                    </div>
                    <StatusBadge status="LIFTED" size="sm" />
                  </div>

                  {m.liftDetails && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-slate-600">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Lift Date</span>
                        <span className="font-mono">{m.liftDetails.liftDate}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Bid Discount</span>
                        <span className="font-mono font-bold text-amber-600">₹{parseFloat(m.liftDetails.bidDiscount).toFixed(0)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Amount Released</span>
                        <span className="font-mono font-bold text-emerald-700">₹{parseFloat(m.liftDetails.amountReleased).toFixed(0)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Dividend Distributed</span>
                        <span className="font-mono">₹{parseFloat(m.liftDetails.dividendPerMember).toFixed(0)}/member</span>
                      </div>
                    </div>
                  )}
                </div>
              ))
          )}
        </div>
      )}

      {/* Enroll Member Modal */}
      <EnrollMemberModal
        isOpen={isEnrollOpen}
        onClose={() => setIsEnrollOpen(false)}
        chitId={chit.id}
        nextAvailableSeat={nextSeat}
      />

      {/* Member Ledger Modal */}
      {selectedLedgerMember && (
        <Modal
          isOpen={!!selectedLedgerMember}
          onClose={() => setSelectedLedgerMember(null)}
          title={`Ledger: ${selectedLedgerMember.fullName} (Seat #${selectedLedgerMember.seatNumber})`}
          subtitle={`Scheme: ${chit.chitName} [${chit.chitCode}]`}
          maxWidth="2xl"
        >
          <div className="space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-2.5">Seq</th>
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
                  {selectedLedgerMember.dues?.map((due: any) => (
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
              <Button size="sm" onClick={() => setSelectedLedgerMember(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
