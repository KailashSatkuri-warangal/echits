import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IndianRupee, Lock, Mail, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('admin@echits.com');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 antialiased selection:bg-emerald-500 selection:text-white">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg mx-auto font-black text-2xl">
            ₹
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">eChits Platform</h1>
          <p className="text-xs text-slate-500 font-medium">Production Chit Fund Management & Collection</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Email or Phone Number</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@echits.com or 9845012345"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
              />
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full" isLoading={isLoading} rightIcon={<ArrowRight size={18} />}>
            Sign In to eChits
          </Button>
        </form>

        {/* Quick Role Fill for evaluation */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
            Staff & Admin Logins
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleQuickLogin('superadmin@echits.com', 'Admin@123')}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-left transition-colors"
            >
              <div className="font-bold text-slate-900">Super Admin</div>
              <div className="text-[10px] text-slate-400">Full System Access</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@echits.com', 'Admin@123')}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-left transition-colors"
            >
              <div className="font-bold text-slate-900">Branch Admin</div>
              <div className="text-[10px] text-slate-400">Chits & Operations</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('collector@echits.com', 'Admin@123')}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-left transition-colors"
            >
              <div className="font-bold text-slate-900">Collection Staff</div>
              <div className="text-[10px] text-slate-400">Daily Collections</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('accountant@echits.com', 'Admin@123')}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-left transition-colors"
            >
              <div className="font-bold text-slate-900">Accountant</div>
              <div className="text-[10px] text-slate-400">Closing & Reports</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
