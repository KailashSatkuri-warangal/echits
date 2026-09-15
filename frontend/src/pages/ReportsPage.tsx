import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Download, Printer, Filter, Calendar, Layers, Clock, AlertTriangle } from 'lucide-react';
import { reportsService } from '../services/reports.service';
import { CurrencyText } from '../components/ui/CurrencyText';
import { StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';

export const ReportsPage: React.FC = () => {
  const [activeReport, setActiveReport] = useState<'daily' | 'chit-wise' | 'ageing'>('daily');
  const todayStr = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);

  const { data: dailyReport, isLoading: isDailyLoading } = useQuery({
    queryKey: ['reportDaily', startDate, endDate],
    queryFn: () => reportsService.getDailyCollection(startDate, endDate),
    enabled: activeReport === 'daily',
  });

  const { data: chitWiseReport = [], isLoading: isChitWiseLoading } = useQuery({
    queryKey: ['reportChitWise'],
    queryFn: () => reportsService.getChitWise(),
    enabled: activeReport === 'chit-wise',
  });

  const { data: ageingReport, isLoading: isAgeingLoading } = useQuery({
    queryKey: ['reportAgeing'],
    queryFn: () => reportsService.getOverdueAgeing(),
    enabled: activeReport === 'ageing',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Financial Reports</h1>
          <p className="text-xs text-slate-500 font-medium">Authoritative financial statements, performance & ageing reports</p>
        </div>

        <Button variant="outline" size="sm" onClick={handlePrint} leftIcon={<Printer size={15} />}>
          Print / Export
        </Button>
      </div>

      {/* Report Type Selector */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveReport('daily')}
          className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-colors ${
            activeReport === 'daily' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Daily Collections Report
        </button>

        <button
          onClick={() => setActiveReport('chit-wise')}
          className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-colors ${
            activeReport === 'chit-wise' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Scheme Performance Report
        </button>

        <button
          onClick={() => setActiveReport('ageing')}
          className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-colors ${
            activeReport === 'ageing' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Overdue Ageing Analysis
        </button>
      </div>

      {/* REPORT 1: DAILY COLLECTION */}
      {activeReport === 'daily' && (
        <div className="space-y-4">
          {/* Date Range Picker */}
          <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-soft flex flex-wrap items-center gap-3 text-xs">
            <span className="font-bold text-slate-700">Date Range:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-medium text-slate-800"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-medium text-slate-800"
            />
          </div>

          {/* Mode Breakdown */}
          {dailyReport && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-soft">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Collection</span>
                <CurrencyText amount={dailyReport.totalCollected} size="lg" variant="success" />
                <span className="text-[10px] text-slate-500 block mt-0.5">{dailyReport.totalTransactions} Transactions</span>
              </div>

              <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-soft">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Cash Portion</span>
                <CurrencyText amount={dailyReport.modeBreakdown?.CASH || 0} size="md" />
              </div>

              <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-soft">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">UPI / Digital</span>
                <CurrencyText amount={dailyReport.modeBreakdown?.UPI || 0} size="md" />
              </div>

              <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-soft">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Bank / Cheque</span>
                <CurrencyText amount={(dailyReport.modeBreakdown?.BANK_TRANSFER || 0) + (dailyReport.modeBreakdown?.CHEQUE || 0)} size="md" />
              </div>
            </div>
          )}

          {/* Transactions List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">Receipt No</th>
                    <th className="p-3">Member</th>
                    <th className="p-3">Chit</th>
                    <th className="p-3">Mode</th>
                    <th className="p-3">Collector</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {dailyReport?.items?.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-900">{p.receiptNumber}</td>
                      <td className="p-3 font-bold text-slate-800">{p.member?.fullName}</td>
                      <td className="p-3 font-mono text-slate-600">{p.chit?.chitCode || 'Multi-Chit'}</td>
                      <td className="p-3">{p.paymentMode}</td>
                      <td className="p-3 text-slate-500">{p.collectedByUser?.name}</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-700">₹{parseFloat(p.totalAmount).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 2: CHIT-WISE SCHEME PERFORMANCE */}
      {activeReport === 'chit-wise' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Chit Code</th>
                  <th className="p-3">Scheme Name</th>
                  <th className="p-3">Seats</th>
                  <th className="p-3 text-right">Target Expected</th>
                  <th className="p-3 text-right">Total Collected</th>
                  <th className="p-3 text-right">Pending Dues</th>
                  <th className="p-3 text-right">Overdue</th>
                  <th className="p-3 text-center">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {chitWiseReport.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-900">{c.chitCode}</td>
                    <td className="p-3 font-bold text-slate-800">{c.chitName}</td>
                    <td className="p-3 font-mono">{c.enrolled}/{c.capacity}</td>
                    <td className="p-3 text-right font-mono">₹{c.expected.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700">₹{c.collected.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-mono font-bold text-amber-600">₹{c.pending.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-mono font-bold text-rose-600">₹{c.overdue.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-center">
                      <span className="font-bold text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        {c.collectionPercentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 3: OVERDUE AGEING */}
      {activeReport === 'ageing' && ageingReport && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {Object.entries(ageingReport).map(([key, bucket]: [string, any]) => (
              <div key={key} className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-soft">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">{bucket.label}</span>
                <CurrencyText amount={bucket.amount} size="lg" variant="danger" />
                <span className="text-[10px] text-slate-500 block mt-0.5">{bucket.count} Accounts</span>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-soft p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Overdue Accounts Itemized</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {Object.values(ageingReport).flatMap((b: any) => b.items).map((item: any) => (
                <div key={item.dueId} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{item.memberName}</span>
                    <span className="text-slate-500 ml-2 font-mono">{item.memberCode} | {item.memberPhone}</span>
                    <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                      {item.chitCode} • Month #{item.monthSequence} • Due: {item.dueDate} ({item.daysOverdue} days overdue)
                    </div>
                  </div>
                  <div className="text-right">
                    <CurrencyText amount={item.balanceDue} size="md" variant="danger" />
                    {item.interestAmount > 0 && (
                      <div className="text-[10px] text-amber-600 font-bold">Int: ₹{item.interestAmount}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
