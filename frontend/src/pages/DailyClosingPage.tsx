import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, ShieldCheck, CheckCircle2, AlertTriangle, IndianRupee, Calendar } from 'lucide-react';
import { closingService } from '../services/closing.service';
import { CurrencyText } from '../components/ui/CurrencyText';
import { StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';

export const DailyClosingPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [actualCash, setActualCash] = useState<string>('');
  const [notes, setNotes] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['dailyClosing', selectedDate],
    queryFn: () => closingService.getForDate(selectedDate),
  });

  const reconcileMutation = useMutation({
    mutationFn: () => closingService.reconcile(selectedDate, parseFloat(actualCash) || 0, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyClosing', selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['closingHistory'] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const metrics = data?.metrics;
  const isClosed = metrics?.status === 'CLOSED';
  const expectedCash = metrics?.expectedClosingCash || 0;
  const parsedActual = parseFloat(actualCash) || 0;
  const diff = parsedActual - expectedCash;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Daily Cash Closing</h1>
          <p className="text-xs text-slate-500 font-medium">Reconcile daily cash register & payment mode breakdown</p>
        </div>

        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-slate-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800"
          />
        </div>
      </div>

      {/* Main Closing Status Card */}
      <div className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200/90 shadow-soft space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Clock className="text-emerald-600" size={20} />
            <h2 className="text-base font-extrabold text-slate-900">Shift Reconciliation: {selectedDate}</h2>
          </div>
          <StatusBadge status={metrics?.status || 'OPEN'} size="md" />
        </div>

        {/* Collection By Mode Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Opening Cash</span>
            <CurrencyText amount={metrics?.openingCash || 0} size="md" />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Cash Collected</span>
            <CurrencyText amount={metrics?.cashCollected || 0} size="md" variant="success" />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">UPI / Digital</span>
            <CurrencyText amount={metrics?.upiCollected || 0} size="md" variant="default" />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Bank / Cheque</span>
            <CurrencyText amount={(metrics?.bankCollected || 0) + (metrics?.chequeCollected || 0)} size="md" variant="default" />
          </div>
        </div>

        {/* Total Collections Summary */}
        <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <div className="text-xs text-slate-400">Total Money Received across All Modes</div>
            <CurrencyText amount={metrics?.totalCollected || 0} size="2xl" variant="default" className="text-white" />
          </div>
          <div className="text-right">
            <div className="text-xs text-emerald-400 font-bold uppercase">Expected Physical Cash in Register:</div>
            <CurrencyText amount={expectedCash} size="xl" variant="default" className="text-emerald-300" />
          </div>
        </div>

        {/* Reconcile Form */}
        {!isClosed ? (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Authorize & Close Shift</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Actual Physical Cash Counted (₹) *</label>
                <input
                  type="number"
                  step="any"
                  placeholder="Count notes and coins in register..."
                  value={actualCash}
                  onChange={(e) => setActualCash(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-base font-bold font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Closing Notes / Discrepancy Reason</label>
                <input
                  type="text"
                  placeholder="Notes on denomination or petty cash..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {actualCash !== '' && (
              <div
                className={`p-3 rounded-xl border text-xs font-bold flex justify-between ${
                  diff === 0
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <span>Register Cash Difference:</span>
                <span>{diff === 0 ? 'Exact Match (₹0.00)' : `₹${diff.toFixed(2)} (${diff > 0 ? 'Excess' : 'Shortage'})`}</span>
              </div>
            )}

            <Button
              size="lg"
              className="w-full"
              onClick={() => reconcileMutation.mutate()}
              isLoading={reconcileMutation.isPending}
              disabled={actualCash === ''}
              leftIcon={<ShieldCheck size={18} />}
            >
              Reconcile & Confirm Shift Closing
            </Button>
          </div>
        ) : (
          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2 text-xs text-emerald-900">
            <div className="flex items-center gap-2 font-bold text-emerald-950">
              <CheckCircle2 size={18} className="text-emerald-600" />
              <span>Shift Reconciled and Closed</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-emerald-200/60">
              <div>Expected Cash: ₹{expectedCash.toFixed(2)}</div>
              <div>Actual Cash Counted: ₹{parseFloat(metrics.actualClosingCash).toFixed(2)}</div>
              <div>Difference: ₹{parseFloat(metrics.difference).toFixed(2)}</div>
              <div>Closed By: Staff User</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
