import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IndianRupee, Search, ShieldCheck, ArrowRight, UserCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { CurrencyText } from '../ui/CurrencyText';
import { StatusBadge } from '../ui/Badge';
import { membersService } from '../../services/members.service';
import { paymentsService } from '../../services/payments.service';
import { PaymentMode, MemberSummary } from '../../types';
import { ReceiptModal } from './ReceiptModal';
import confetti from 'canvas-confetti';

interface PaymentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedMemberId?: string;
  preselectedChitId?: string;
  preselectedDueId?: string;
}

export const PaymentDrawer: React.FC<PaymentDrawerProps> = ({
  isOpen,
  onClose,
  preselectedMemberId,
  preselectedChitId,
  preselectedDueId,
}) => {
  const queryClient = useQueryClient();

  // Search & Member selection
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<MemberSummary | null>(null);
  const [selectedChitId, setSelectedChitId] = useState<string>('');
  const [selectedDueId, setSelectedDueId] = useState<string>('');

  // Payment form state
  const [amount, setAmount] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(PaymentMode.CASH);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => crypto.randomUUID());

  // Receipt Modal State
  const [completedReceipt, setCompletedReceipt] = useState<any>(null);

  // Search query
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['memberSearch', searchQuery],
    queryFn: () => membersService.search(searchQuery),
    enabled: isOpen && !selectedMember,
  });

  // Preselection effect
  useEffect(() => {
    if (preselectedMemberId && isOpen) {
      membersService.search(preselectedMemberId).then((res) => {
        if (res.items && res.items.length > 0) {
          const found = res.items.find((m) => m.id === preselectedMemberId) || res.items[0];
          setSelectedMember(found);
          if (preselectedChitId) {
            setSelectedChitId(preselectedChitId);
          } else if (found.chits.length > 0) {
            setSelectedChitId(found.chits[0].chitId);
          }
        }
      });
    }
  }, [preselectedMemberId, preselectedChitId, isOpen]);

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      setIdempotencyKey(crypto.randomUUID());
      if (!preselectedMemberId) {
        setSelectedMember(null);
        setSelectedChitId('');
        setSelectedDueId('');
        setAmount('');
        setReferenceNumber('');
        setNotes('');
      }
    }
  }, [isOpen, preselectedMemberId]);

  // Fetch Member 360 when member selected to get live dues
  const { data: member360 } = useQuery({
    queryKey: ['member360', selectedMember?.id],
    queryFn: () => membersService.get360(selectedMember!.id),
    enabled: !!selectedMember?.id,
  });

  // Active chit membership
  const activeMembership = member360?.memberships?.find((ms: any) => ms.chitId === selectedChitId);
  const dues = activeMembership?.dues || [];
  const unpaidDues = dues.filter((d: any) => parseFloat(d.balanceDue) > 0);
  const activeDue = unpaidDues.find((d: any) => d.id === selectedDueId) || unpaidDues[0];

  // Auto-fill amount when due is chosen
  useEffect(() => {
    if (activeDue) {
      setAmount(String(parseFloat(activeDue.balanceDue) || 0));
    } else if (selectedMember) {
      setAmount(String(selectedMember.totalOutstanding || 0));
    }
  }, [activeDue, selectedMember]);

  // Payment mutation
  const paymentMutation = useMutation({
    mutationFn: async () => {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error('Please enter a valid payment amount');
      }

      return paymentsService.recordPayment({
        memberId: selectedMember!.id,
        chitId: selectedChitId || undefined,
        monthlyDueId: activeDue?.id || undefined,
        amount: numAmount,
        paymentMode,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        idempotencyKey,
      });
    },
    onSuccess: (receiptData) => {
      // Trigger confetti celebration
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch (e) {}

      queryClient.invalidateQueries({ queryKey: ['dashboardKpis'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['chits'] });
      queryClient.invalidateQueries({ queryKey: ['member360'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });

      setCompletedReceipt(receiptData);
    },
  });

  const parsedAmount = parseFloat(amount) || 0;
  const targetDueTotal = activeDue ? parseFloat(activeDue.totalDue) || 0 : (selectedMember?.totalOutstanding || 0);
  const targetBalanceRemaining = Math.max(0, targetDueTotal - parsedAmount);
  const excessAdvance = Math.max(0, parsedAmount - targetDueTotal);

  return (
    <>
      <BottomSheet
        isOpen={isOpen && !completedReceipt}
        onClose={onClose}
        title="Record Chit Collection"
        subtitle="Authoritative real-time payment entry"
      >
        <div className="space-y-4">
          {/* STEP 1: Select Member if not selected */}
          {!selectedMember ? (
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Search Member</label>
              <div className="relative">
                <Search className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by Name, Mobile, or Member ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-medium"
                  autoFocus
                />
              </div>

              <div className="space-y-2 mt-2 max-h-64 overflow-y-auto">
                {isSearching ? (
                  <div className="text-center py-6 text-slate-400 text-xs">Searching members...</div>
                ) : searchResults?.items && searchResults.items.length > 0 ? (
                  searchResults.items.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => {
                        setSelectedMember(m);
                        if (m.chits.length > 0) {
                          setSelectedChitId(m.chits[0].chitId);
                        }
                      }}
                      className="p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{m.fullName}</span>
                          <span className="text-[10px] font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                            {m.memberCode}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{m.phone}</p>
                        {m.chitsCount > 1 && (
                          <span className="text-[10px] font-bold text-amber-600 mt-1 inline-block">
                            {m.chitsCount} Chits Enrolled
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Outstanding</div>
                        <CurrencyText amount={m.totalOutstanding} size="sm" variant={m.totalOutstanding > 0 ? 'danger' : 'success'} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-400 text-xs">No members found matching your search.</div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Member Card Header */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{selectedMember.fullName}</span>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                      {selectedMember.memberCode}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{selectedMember.phone}</p>
                </div>
                {!preselectedMemberId && (
                  <button
                    onClick={() => {
                      setSelectedMember(null);
                      setSelectedChitId('');
                    }}
                    className="text-xs text-emerald-600 font-bold hover:underline"
                  >
                    Change
                  </button>
                )}
              </div>

              {/* STEP 2: Select Chit if member has multiple chits */}
              {selectedMember.chits && selectedMember.chits.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Select Chit Scheme</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedMember.chits.map((c) => (
                      <div
                        key={c.chitId}
                        onClick={() => setSelectedChitId(c.chitId)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          selectedChitId === c.chitId
                            ? 'bg-emerald-50/60 border-emerald-500 ring-1 ring-emerald-500 shadow-sm'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-800">{c.chitName}</span>
                          <span className="text-[10px] font-semibold text-slate-500">Seat {c.seatNumber}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[11px] text-slate-500">Pending:</span>
                          <CurrencyText amount={c.pendingAmount} size="sm" variant={c.pendingAmount > 0 ? 'danger' : 'success'} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 3: Financial Calculation Breakdown (Authoritative Server Breakdown) */}
              {activeDue && (
                <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2.5 shadow-sm">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-semibold text-slate-300">
                      Month #{activeDue.chitMonth?.monthSequence} ({activeDue.chitMonth?.calendarMonth}/{activeDue.chitMonth?.calendarYear})
                    </span>
                    <StatusBadge status={activeDue.status} size="sm" />
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                    <div className="text-slate-400">Scheduled Installment:</div>
                    <div className="text-right font-mono font-medium text-slate-200">
                      ₹{parseFloat(activeDue.scheduledDue).toFixed(2)}
                    </div>

                    <div className="text-slate-400">Previous Carry Balance:</div>
                    <div className="text-right font-mono font-medium text-slate-200">
                      ₹{parseFloat(activeDue.previousBalance).toFixed(2)}
                    </div>

                    {parseFloat(activeDue.interestAmount) > 0 && (
                      <>
                        <div className="text-amber-400">Interest ({activeDue.interestRate}%):</div>
                        <div className="text-right font-mono font-bold text-amber-400">
                          +₹{parseFloat(activeDue.interestAmount).toFixed(2)}
                        </div>
                      </>
                    )}

                    {parseFloat(activeDue.lateFee) > 0 && (
                      <>
                        <div className="text-rose-400">Late Fee:</div>
                        <div className="text-right font-mono font-medium text-rose-400">
                          +₹{parseFloat(activeDue.lateFee).toFixed(2)}
                        </div>
                      </>
                    )}

                    {parseFloat(activeDue.adjustmentAmount) > 0 && (
                      <>
                        <div className="text-emerald-400">Approved Waiver:</div>
                        <div className="text-right font-mono font-medium text-emerald-400">
                          -₹{parseFloat(activeDue.adjustmentAmount).toFixed(2)}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">Total Month Due:</span>
                    <CurrencyText amount={activeDue.totalDue} size="md" variant="default" className="text-white" />
                  </div>
                </div>
              )}

              {/* STEP 4: Payment Amount Entry & Quick Fill Buttons */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Payment Amount (₹)</label>
                <div className="relative">
                  <div className="absolute left-4 top-3.5 text-slate-500 font-bold text-lg">₹</div>
                  <input
                    type="number"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-9 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-bold font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
                  />
                </div>

                {/* Quick Fill Chips */}
                {activeDue && (
                  <div className="flex gap-2 pt-1 overflow-x-auto pb-1">
                    <button
                      type="button"
                      onClick={() => setAmount(String(parseFloat(activeDue.balanceDue)))}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 whitespace-nowrap"
                    >
                      Full Due (₹{parseFloat(activeDue.balanceDue).toFixed(0)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAmount(String(parseFloat(activeDue.scheduledDue)))}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 whitespace-nowrap"
                    >
                      Base Installment (₹{parseFloat(activeDue.scheduledDue).toFixed(0)})
                    </button>
                    {selectedMember.totalOutstanding > parseFloat(activeDue.balanceDue) && (
                      <button
                        type="button"
                        onClick={() => setAmount(String(selectedMember.totalOutstanding))}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 whitespace-nowrap"
                      >
                        All Chits Total (₹{selectedMember.totalOutstanding.toFixed(0)})
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* STEP 5: Payment Mode Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Payment Mode</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { mode: PaymentMode.CASH, label: 'Cash' },
                    { mode: PaymentMode.UPI, label: 'UPI' },
                    { mode: PaymentMode.BANK_TRANSFER, label: 'Bank' },
                    { mode: PaymentMode.CHEQUE, label: 'Cheque' },
                  ].map((item) => (
                    <button
                      key={item.mode}
                      type="button"
                      onClick={() => setPaymentMode(item.mode)}
                      className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                        paymentMode === item.mode
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reference Number for UPI/Bank/Cheque */}
              {paymentMode !== PaymentMode.CASH && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Transaction / Reference Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="UPI Ref ID, UTR Number, or Cheque No"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              {/* Impact Preview */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Collecting Amount:</span>
                  <span className="font-bold text-emerald-800">₹{parsedAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Balance After Payment:</span>
                  <span className="font-bold text-slate-800">₹{targetBalanceRemaining.toFixed(2)}</span>
                </div>
                {excessAdvance > 0 && (
                  <div className="flex justify-between text-indigo-700 font-bold">
                    <span>Credited as Advance:</span>
                    <span>₹{excessAdvance.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Confirmation CTA */}
              <div className="pt-2">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => paymentMutation.mutate()}
                  isLoading={paymentMutation.isPending}
                  disabled={parsedAmount <= 0}
                  leftIcon={<ShieldCheck size={20} />}
                >
                  Confirm & Collect ₹{parsedAmount.toFixed(2)}
                </Button>
              </div>
            </>
          )}
        </div>
      </BottomSheet>

      {/* Instant Professional Receipt Modal */}
      {completedReceipt && (
        <ReceiptModal
          isOpen={!!completedReceipt}
          onClose={() => {
            setCompletedReceipt(null);
            onClose();
          }}
          receiptData={completedReceipt}
        />
      )}
    </>
  );
};
