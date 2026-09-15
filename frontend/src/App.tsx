import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';

import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { MembersPage } from './pages/MembersPage';
import { Member360Page } from './pages/Member360Page';
import { ChitsPage } from './pages/ChitsPage';
import { Chit360Page } from './pages/Chit360Page';
import { CollectionsPage } from './pages/CollectionsPage';
import { DailyClosingPage } from './pages/DailyClosingPage';
import { ReportsPage } from './pages/ReportsPage';
import { LiftPage } from './pages/LiftPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { MorePage } from './pages/MorePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5000,
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<HomePage />} />
              <Route path="members" element={<MembersPage />} />
              <Route path="members/:id" element={<Member360Page />} />
              <Route path="chits" element={<ChitsPage />} />
              <Route path="chits/:id" element={<Chit360Page />} />
              <Route path="collections" element={<CollectionsPage />} />
              <Route path="daily-closing" element={<DailyClosingPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="lift" element={<LiftPage />} />
              <Route path="audit-logs" element={<AuditLogsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="more" element={<MorePage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};
