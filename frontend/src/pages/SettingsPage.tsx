import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Save, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: settings = [] } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res as any;
    },
  });

  const [formState, setFormState] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      return api.post('/settings', { key, value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  const handleSave = (key: string) => {
    const val = formState[key];
    if (val !== undefined) {
      mutation.mutate({ key, value: val });
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Business Rule Configuration</h1>
        <p className="text-xs text-slate-500 font-medium">Configure interest engine basis, grace periods, and platform defaults</p>
      </div>

      {/* Settings Cards */}
      <div className="space-y-3">
        {settings.map((s: any) => {
          const curVal = formState[s.key] !== undefined ? formState[s.key] : s.value;
          return (
            <div key={s.id} className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-soft flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{s.key}</span>
                  <span className="text-[10px] font-bold uppercase bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                    {s.group}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{s.description || 'System setting'}</p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={curVal}
                  onChange={(e) => setFormState({ ...formState, [s.key]: e.target.value })}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold flex-1 sm:w-48 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Button
                  size="sm"
                  onClick={() => handleSave(s.key)}
                  isLoading={mutation.isPending && mutation.variables?.key === s.key}
                  leftIcon={<Save size={14} />}
                >
                  Save
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
