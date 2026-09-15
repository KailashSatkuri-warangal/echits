import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  IndianRupee,
  TrendingUp,
  AlertTriangle,
  Clock,
  Layers,
  ChevronRight,
  ShieldCheck,
  Search,
  ArrowUpRight,
  Receipt,
  UserCheck,
} from 'lucide-react';
import { reportsService } from '../services/reports.service';
import { CurrencyText } from '../components/ui/CurrencyText';
import { StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';

export const HomePage: React.FC = () => {
  const { openPaymentDrawer } = useOutletContext<{ openPaymentDrawer: (params?: any) => void }>();
  const navigate = useNavigate();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboardKpis'],
    queryFn: () => reportsService.getDashboardKpis(),
    refetchInterval: 30000,
  });

  const kpis = dashboardData?.kpis;
  const attentionItems = dashboardData?.attentionItems || [];
  const recentPayments = dashboardData?.recentPayments || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner / Fast Search Shortcut */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Collection Dashboard</h1>
          <p className="text-xs text-slate-500 font-medium">Real-time financial status & collection operations</p>
        </div>

        <button
          onClick={() => navigate('/members')}
          className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs font-semibold text-slate-600 hover:border-emerald-500 hover:bg-emerald-50/20 shadow-soft transition-all text-left"
        >
          <Search size={16} className="text-slate-400" />
          <span>Quick Member Search...</span>
        </button>
      </div>

      {/* Primary Mobile CTA Banner */}
      <div className="p-5 sm:p-6 bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 rounded-3xl text-white shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Active Shift Live Collection
          </div>
          <div className="text-2xl sm:text-3xl font-black tracking-tight pt-1">
            {isLoading ? <Skeleton className="h-8 w-40 bg-slate-700" /> : <CurrencyText amount={kpis?.todayCollection || 0} size="3xl" variant="default" className="text-white" />}
          </div>
          <p className="text-xs text-slate-400">Total collection recorded today across all chits</p>
        </div>

        <div className="w-full sm:w-auto relative z-10">
          <Button
            size="lg"
            className="w-full sm:w-auto shadow-lg shadow-emerald-900/40"
            onClick={() => openPaymentDrawer()}
            leftIcon={<IndianRupee size={20} />}
          >
            Record Payment Now
          </Button>
        </div>
      </div>

      {/* Core Financial KPIs Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Month Collection */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-soft space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">This Month</span>
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <div className="pt-1">
            {isLoading ? <Skeleton className="h-6 w-24" /> : <CurrencyText amount={kpis?.monthCollection || 0} size="xl" variant="success" />}
          </div>
          <p className="text-[11px] text-slate-500">Total collected this month</p>
        </div>

        {/* Due Today */}
        <div
          onClick={() => navigate('/collections?tab=due-today')}
          className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-soft space-y-1 hover:border-blue-400 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Due Today</span>
            <Clock size={16} className="text-blue-500" />
          </div>
          <div className="pt-1">
            {isLoading ? <Skeleton className="h-6 w-24" /> : <CurrencyText amount={kpis?.dueTodayAmount || 0} size="xl" variant="default" />}
          </div>
          <p className="text-[11px] text-slate-500">{kpis?.dueTodayCount || 0} members due today</p>
        </div>

        {/* Overdue */}
        <div
          onClick={() => navigate('/collections?tab=overdue')}
          className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-soft space-y-1 hover:border-rose-400 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Overdue Dues</span>
            <AlertTriangle size={16} className="text-rose-500" />
          </div>
          <div className="pt-1">
            {isLoading ? <Skeleton className="h-6 w-24" /> : <CurrencyText amount={kpis?.overdueAmount || 0} size="xl" variant="danger" />}
          </div>
          <p className="text-[11px] text-slate-500">{kpis?.overdueCount || 0} accounts crossed grace</p>
        </div>

        {/* Interest Pending */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-soft space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Interest Accrued</span>
            <Layers size={16} className="text-amber-500" />
          </div>
          <div className="pt-1">
            {isLoading ? <Skeleton className="h-6 w-24" /> : <CurrencyText amount={kpis?.interestPending || 0} size="xl" variant="warning" />}
          </div>
          <p className="text-[11px] text-slate-500">Unpaid monthly overdue interest</p>
        </div>
      </div>

      {/* Attention Required Section */}
      {attentionItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Attention Required
            </h2>
            <span className="text-xs text-slate-500 font-medium">Tap to view filtered accounts</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {attentionItems.map((item) => {
              const borderColors = {
                info: 'border-blue-200 bg-blue-50/40 hover:border-blue-400',
                warning: 'border-amber-200 bg-amber-50/40 hover:border-amber-400',
                danger: 'border-rose-200 bg-rose-50/40 hover:border-rose-400',
              }[item.severity];

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.type === 'DUE_TODAY') navigate('/collections?tab=due-today');
                    else if (item.type === 'OVERDUE') navigate('/collections?tab=overdue');
                    else if (item.type === 'MULTI_CHIT_PENDING') navigate('/members');
                    else navigate('/collections');
                  }}
                  className={`p-4 rounded-2xl border ${borderColors} transition-all cursor-pointer space-y-2 shadow-sm`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{item.title}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white shadow-xs">
                      {item.count} Accounts
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{item.description}</p>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <span className="text-[11px] text-slate-500">Total Amount:</span>
                    <CurrencyText amount={item.amount} size="sm" variant="danger" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Payments Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
            Recent Collections
          </h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/collections?tab=history')} rightIcon={<ChevronRight size={14} />}>
            View All
          </Button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden divide-y divide-slate-100">
          {recentPayments.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">No payment transactions recorded yet.</div>
          ) : (
            recentPayments.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/collections?tab=history&search=${p.receiptNumber}`)}
                className="p-3.5 sm:p-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <Receipt size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{p.member?.fullName}</span>
                      <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                        {p.receiptNumber}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {p.chit?.chitCode || 'Multi-Chit'} • Via {p.paymentMode} • {new Date(p.collectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <CurrencyText amount={p.totalAmount} size="md" variant="success" />
                  <div className="text-[10px] text-slate-400">By {p.collectedByUser?.name}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
