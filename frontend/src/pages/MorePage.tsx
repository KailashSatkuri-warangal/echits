import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Clock,
  Gavel,
  BarChart3,
  History,
  Settings,
  Shield,
  LogOut,
  ChevronRight,
  User,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const MorePage: React.FC = () => {
  const { user, logout, isAdmin, isSuperAdmin, isAccountant } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { to: '/daily-closing', label: 'Daily Cash Closing', subtitle: 'Reconcile shift register & payment modes', icon: Clock },
    ...(isAdmin ? [{ to: '/lift', label: 'Lift & Auction Registry', subtitle: 'Manage auction winners & dividends', icon: Gavel }] : []),
    ...((isAdmin || isAccountant) ? [{ to: '/reports', label: 'Financial Reports', subtitle: 'Daily collections, ageing & schemes', icon: BarChart3 }] : []),
    ...(isSuperAdmin ? [{ to: '/audit-logs', label: 'Immutable Audit Trail', subtitle: 'System operational event log', icon: History }] : []),
    ...(isAdmin ? [{ to: '/settings', label: 'Business Rules & Defaults', subtitle: 'Interest rates, grace periods & rules', icon: Settings }] : []),
  ];

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">More Operations</h1>
        <p className="text-xs text-slate-500 font-medium">Administration, reporting, and settings</p>
      </div>

      {/* User Card */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-soft flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-base flex items-center justify-center">
            {user?.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">{user?.name}</h3>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <span className="text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded mt-1 inline-block">
              {user?.role.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Operations Menu */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden divide-y divide-slate-100">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Icon size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">{item.label}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{item.subtitle}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </NavLink>
          );
        })}
      </div>

      {/* Sign Out Button */}
      <div className="pt-2">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 p-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-2xl font-bold text-xs transition-colors border border-rose-200"
        >
          <LogOut size={16} />
          <span>Sign Out of Account</span>
        </button>
      </div>
    </div>
  );
};
