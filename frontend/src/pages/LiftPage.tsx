import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Gavel, UserCheck, Plus, CheckCircle2, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { chitsService } from '../services/chits.service';
import { CurrencyText } from '../components/ui/CurrencyText';
import { StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';

export const LiftPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isRecordLiftOpen, setIsRecordLiftOpen] = useState(false);
  const [selectedChitId, setSelectedChitId] = useState('');
  const [selectedMembershipId, setSelectedMembershipId] = useState('');
  const [selectedMonthId, setSelectedMonthId] = useState('');
  const [liftDate, setLiftDate] = useState(new Date().toISOString().slice(0, 10));
  const [bidDiscount, setBidDiscount] = useState('75000');
  const [remarks, setRemarks] = useState('');

  // Fetch all lift events
  const { data: liftEvents = [], isLoading } = useQuery({
    queryKey: ['liftEvents'],
    queryFn: async () => {
      const res = await api.get('/lift-events');
      return res as any;
    },
  });

  // Fetch all chits for modal
  const { data: chits = [] } = useQuery({
    queryKey: ['chits'],
    queryFn: () => chitsService.getAll(),
    enabled: isRecordLiftOpen,
  });

  // Fetch 360 for selected chit to get memberships & months
  const { data: selectedChit360 } = useQuery({
    queryKey: ['chit360', selectedChitId],
    queryFn: () => chitsService.get360(selectedChitId),
    enabled: !!selectedChitId,
  });

  const recordLiftMutation = useMutation({
    mutationFn: async () => {
      return api.post('/lift-events', {
        membershipId: selectedMembershipId,
        chitMonthId: selectedMonthId,
        liftDate,
        bidDiscount: parseFloat(bidDiscount),
        remarks,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liftEvents'] });
      queryClient.invalidateQueries({ queryKey: ['chits'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      setIsRecordLiftOpen(false);
    },
  });

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Chit Lift & Auction Registry</h1>
          <p className="text-xs text-slate-500 font-medium">Record monthly auction winners, dividend distributions, and future schedules</p>
        </div>

        <Button onClick={() => setIsRecordLiftOpen(true)} leftIcon={<Gavel size={16} />}>
          Record Auction Lift
        </Button>
      </div>

      {/* Lift List */}
      <div className="space-y-3">
        {isLoading ? (
          <Skeleton className="h-36 w-full" />
        ) : liftEvents.length === 0 ? (
          <div className="p-8 bg-white rounded-2xl border text-center text-slate-400 text-xs">
            No auction lift events recorded yet.
          </div>
        ) : (
          liftEvents.map((lift: any) => (
            <div key={lift.id} className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-soft space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-base">{lift.membership?.member?.fullName}</span>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      Seat #{lift.membership?.seatNumber}
                    </span>
                    <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {lift.membership?.chit?.chitCode}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Auction Month #{lift.chitMonth?.monthSequence} ({lift.chitMonth?.calendarMonth}/{lift.chitMonth?.calendarYear}) • Lifted on {lift.liftDate}
                  </div>
                </div>

                <StatusBadge status={lift.approvalStatus} size="sm" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Scheme Corpus</span>
                  <CurrencyText amount={lift.chitValue} size="md" showDecimals={false} />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Bid Discount Given</span>
                  <CurrencyText amount={lift.bidDiscount} size="md" variant="warning" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Net Amount Released</span>
                  <CurrencyText amount={lift.amountReleased} size="md" variant="success" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Dividend Distributed</span>
                  <span className="font-mono font-bold text-slate-800">₹{parseFloat(lift.dividendPerMember).toFixed(0)} / seat</span>
                </div>
              </div>

              {lift.remarks && <p className="text-xs text-slate-600 italic">“{lift.remarks}”</p>}
            </div>
          ))
        )}
      </div>

      {/* Record Lift Modal */}
      <Modal
        isOpen={isRecordLiftOpen}
        onClose={() => setIsRecordLiftOpen(false)}
        title="Record Chit Lift / Auction"
        subtitle="Schedules future revised installment while strictly preserving historical records"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            recordLiftMutation.mutate();
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="font-bold text-slate-700 uppercase tracking-wider block mb-1">Select Chit Scheme *</label>
            <select
              required
              value={selectedChitId}
              onChange={(e) => {
                setSelectedChitId(e.target.value);
                setSelectedMembershipId('');
                setSelectedMonthId('');
              }}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
            >
              <option value="">-- Choose Scheme --</option>
              {chits.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.chitName} ({c.chitCode}) - Corpus: ₹{c.totalValue.toLocaleString('en-IN')}
                </option>
              ))}
            </select>
          </div>

          {selectedChit360 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 uppercase tracking-wider block mb-1">Winning Member / Seat *</label>
                  <select
                    required
                    value={selectedMembershipId}
                    onChange={(e) => setSelectedMembershipId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="">-- Choose Member Seat --</option>
                    {selectedChit360.members
                      .filter((m: any) => !m.isLifted)
                      .map((m: any) => (
                        <option key={m.membershipId} value={m.membershipId}>
                          Seat #{m.seatNumber} - {m.fullName}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 uppercase tracking-wider block mb-1">Auction Month Sequence *</label>
                  <select
                    required
                    value={selectedMonthId}
                    onChange={(e) => setSelectedMonthId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="">-- Choose Month --</option>
                    {selectedChit360.months.map((m: any) => (
                      <option key={m.id} value={m.id}>
                        Month #{m.monthSequence} ({m.calendarMonth}/{m.calendarYear})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 uppercase tracking-wider block mb-1">Auction Date *</label>
                  <input
                    type="date"
                    required
                    value={liftDate}
                    onChange={(e) => setLiftDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 uppercase tracking-wider block mb-1">Bid / Discount Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={bidDiscount}
                    onChange={(e) => setBidDiscount(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 uppercase tracking-wider block mb-1">Remarks & Payout Mode</label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Winner verified. Payout processed via RTGS/Cheque."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </>
          )}

          <div className="flex gap-2 pt-3">
            <Button variant="outline" className="flex-1" type="button" onClick={() => setIsRecordLiftOpen(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              type="submit"
              isLoading={recordLiftMutation.isPending}
              disabled={!selectedMembershipId || !selectedMonthId}
              leftIcon={<ShieldCheck size={16} />}
            >
              Confirm Lift Payout
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
