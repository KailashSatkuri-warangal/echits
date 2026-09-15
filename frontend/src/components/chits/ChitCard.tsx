import React from 'react';
import { Layers, Users, Calendar, IndianRupee, ChevronRight, TrendingUp } from 'lucide-react';
import { ChitCardSummary } from '../../types';
import { CurrencyText } from '../ui/CurrencyText';
import { StatusBadge } from '../ui/Badge';
import { useNavigate } from 'react-router-dom';

interface ChitCardProps {
  chit: ChitCardSummary;
}

export const ChitCard: React.FC<ChitCardProps> = ({ chit }) => {
  const navigate = useNavigate();

  const collectionPercent = chit.totalExpected > 0
    ? Math.min(100, Math.round((chit.totalCollected / chit.totalExpected) * 100))
    : 0;

  return (
    <div
      onClick={() => navigate(`/chits/${chit.id}`)}
      className="bg-white rounded-2xl border border-slate-200/90 shadow-soft p-4 hover:border-emerald-400 transition-all cursor-pointer space-y-3.5"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-slate-900 text-base">{chit.chitName}</h3>
            <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
              {chit.chitCode}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
            <span className="flex items-center gap-1 font-medium">
              <Calendar size={13} />
              {chit.durationMonths} Months ({chit.startMonth}/{chit.startYear} - {chit.endMonth}/{chit.endYear})
            </span>
          </div>
        </div>

        <StatusBadge status={chit.status} size="sm" />
      </div>

      {/* Scheme Core Values */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Value</span>
          <CurrencyText amount={chit.totalValue} size="md" showDecimals={false} />
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Monthly Installment</span>
          <CurrencyText amount={chit.defaultInstallment} size="md" showDecimals={false} />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Enrolled Seats</span>
          <div className="flex items-center gap-1.5 font-bold text-slate-800 mt-0.5">
            <Users size={14} className="text-emerald-600" />
            <span>{chit.enrolledMembers} / {chit.capacity} Seats</span>
          </div>
        </div>
      </div>

      {/* Financial Performance & Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-500 font-medium">Collected: <strong className="text-slate-800">₹{chit.totalCollected.toLocaleString('en-IN')}</strong></span>
          <span className="text-slate-500 font-medium">Pending: <strong className="text-rose-600">₹{chit.totalPending.toLocaleString('en-IN')}</strong></span>
        </div>

        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${collectionPercent}%` }}
            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
          />
        </div>

        <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium pt-0.5">
          <span>Current: Month #{chit.currentMonthSequence}</span>
          <span className="font-bold text-emerald-700">{collectionPercent}% Target Collected</span>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-emerald-700 font-bold">
        <span>View 360° Overview & Seat Matrix</span>
        <ChevronRight size={16} />
      </div>
    </div>
  );
};
