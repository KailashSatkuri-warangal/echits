import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNavigation } from './BottomNavigation';
import { DesktopSidebar } from './DesktopSidebar';
import { PaymentDrawer } from '../payments/PaymentDrawer';

export const AppLayout: React.FC = () => {
  const [isPaymentDrawerOpen, setIsPaymentDrawerOpen] = useState(false);
  const [preselectedParams, setPreselectedParams] = useState<{
    memberId?: string;
    chitId?: string;
    dueId?: string;
  }>({});

  const handleOpenPaymentDrawer = (params?: { memberId?: string; chitId?: string; dueId?: string }) => {
    if (params) {
      setPreselectedParams(params);
    } else {
      setPreselectedParams({});
    }
    setIsPaymentDrawerOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* Top Header */}
      <Header />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <DesktopSidebar onOpenPaymentDrawer={() => handleOpenPaymentDrawer()} />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-full overflow-x-hidden pb-24 md:pb-12">
          <Outlet context={{ openPaymentDrawer: handleOpenPaymentDrawer }} />
        </main>
      </div>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <BottomNavigation onOpenPaymentDrawer={() => handleOpenPaymentDrawer()} />

      {/* Global Payment Collection Drawer */}
      <PaymentDrawer
        isOpen={isPaymentDrawerOpen}
        onClose={() => setIsPaymentDrawerOpen(false)}
        preselectedMemberId={preselectedParams.memberId}
        preselectedChitId={preselectedParams.chitId}
        preselectedDueId={preselectedParams.dueId}
      />
    </div>
  );
};
