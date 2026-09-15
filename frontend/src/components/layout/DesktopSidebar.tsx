import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Layers,
  Users,
  WalletCards,
  Receipt,
  Gavel,
  BarChart3,
  FileText,
  Clock,
  Settings,
  History,
  PlusCircle,
  IndianRupee,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface DesktopSidebarProps {
  onOpenPaymentDrawer: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ onOpenPaymentDrawer }) => {
  const { isSuperAdmin, isAdmin, isAccountant } = useAuth();

  const links = [
    { to: '/', label: 'Dashboard', icon: Home },
    { to: '/chits', label: 'Chit Groups', icon: Layers },
    { to: '/members', label: 'Members Directory', icon: Users },
    { to: '/collections', label: 'Collections Workbench', icon: WalletCards },
    { to: '/daily-closing', label: 'Daily Closing', icon: Clock },
    ...(isAdmin ? [{ to: '/lift', label: 'Lift & Auctions', icon: Gavel }] : []),
    ...((isAdmin || isAccountant) ? [{ to: '/reports', label: 'Financial Reports', icon: BarChart3 }] : []),
    ...(isSuperAdmin ? [{ to: '/audit-logs', label: 'Audit Trail', icon: History }] : []),
    ...(isAdmin ? [{ to: '/settings', label: 'Business Rules', icon: Settings }] : []),
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-slate-200/80 bg-white min-h-[calc(100vh-61px)] p-4 sticky top-[61px]">
      {/* Quick CTA */}
      <button
        onClick={onOpenPaymentDrawer}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-sm transition-all active:scale-95 mb-6"
      >
        <IndianRupee size={18} />
        <span>Record Payment</span>
      </button>

      {/* Nav List */}
      <nav className="flex flex-col gap-1 flex-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <Icon size={18} className="text-slate-500 group-hover:text-slate-900" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="font-semibold text-slate-700">Financial Engine Active</span>
        </div>
        <div>Authoritative Backend v1.0</div>
      </div>
    </aside>
  );
};
