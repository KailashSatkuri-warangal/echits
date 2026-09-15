import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Layers, Users, IndianRupee, WalletCards, MoreHorizontal, PlusCircle } from 'lucide-react';

interface BottomNavigationProps {
  onOpenPaymentDrawer: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ onOpenPaymentDrawer }) => {
  const location = useLocation();

  const navItems = [
    { to: '/', label: 'HOME', icon: Home },
    { to: '/chits', label: 'CHITS', icon: Layers },
    { to: '/members', label: 'MEMBERS', icon: Users },
    { to: '/collections', label: 'COLLECTIONS', icon: WalletCards },
    { to: '/more', label: 'MORE', icon: MoreHorizontal },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 md:hidden pb-safe shadow-sticky">
      <div className="flex items-center justify-around px-2 py-1.5 max-w-md mx-auto relative">
        {/* Left 2 Items */}
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center min-w-[56px] py-1 transition-colors ${
                isActive ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon size={20} className={isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
              <span className="text-[10px] tracking-tight mt-0.5 font-medium">{item.label}</span>
            </NavLink>
          );
        })}

        {/* Center Quick Action: RECORD PAYMENT */}
        <div className="flex flex-col items-center -mt-5">
          <button
            onClick={onOpenPaymentDrawer}
            className="w-13 h-13 p-3.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg hover:shadow-emerald-500/30 active:scale-95 transition-all flex items-center justify-center border-4 border-white"
            title="Record Payment"
          >
            <IndianRupee size={22} className="stroke-[2.5]" />
          </button>
          <span className="text-[9px] font-extrabold uppercase tracking-tight text-emerald-700 mt-0.5">Pay</span>
        </div>

        {/* Right 3 Items */}
        {navItems.slice(2).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to || location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center min-w-[56px] py-1 transition-colors ${
                isActive ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon size={20} className={isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
              <span className="text-[10px] tracking-tight mt-0.5 font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};
