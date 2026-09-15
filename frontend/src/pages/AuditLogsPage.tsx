import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, Shield, Filter, Search } from 'lucide-react';
import { api } from '../services/api';
import { Skeleton } from '../components/ui/Skeleton';

export const AuditLogsPage: React.FC = () => {
  const [filterEntity, setFilterEntity] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['auditLogs', filterEntity],
    queryFn: async () => {
      const res = await api.get('/audit-logs', { params: { entityName: filterEntity || undefined } });
      return res as any;
    },
  });

  const logs = data?.items || [];

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Immutable Audit Trail</h1>
        <p className="text-xs text-slate-500 font-medium">Tamper-proof audit logs for all financial operations, payments, and settings</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 text-xs">
        {['', 'Payment', 'Chit', 'LiftEvent', 'Adjustment', 'DailyClosing'].map((entity) => (
          <button
            key={entity}
            onClick={() => setFilterEntity(entity)}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              filterEntity === entity ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {entity || 'All Entities'}
          </button>
        ))}
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Actor</th>
                <th className="p-3">Action</th>
                <th className="p-3">Entity</th>
                <th className="p-3">Details / Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center">
                    <Skeleton className="h-6 w-full" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No audit logs matching query.
                  </td>
                </tr>
              ) : (
                logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 font-bold text-slate-800">
                      {log.actor?.name || 'System / Staff'}
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-600">{log.entityName}</td>
                    <td className="p-3 text-slate-700 max-w-xs truncate">{log.reason || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
