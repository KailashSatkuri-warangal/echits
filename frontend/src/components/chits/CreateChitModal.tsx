import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Layers, Plus } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { chitsService } from '../../services/chits.service';
import { ChitStatus } from '../../types';

interface CreateChitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateChitModal: React.FC<CreateChitModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const now = new Date();

  const [formData, setFormData] = useState({
    chitCode: '',
    chitName: '',
    totalValue: 500000,
    capacity: 20,
    startMonth: now.getMonth() + 1,
    startYear: now.getFullYear(),
    endMonth: ((now.getMonth() + 20) % 12) + 1,
    endYear: now.getFullYear() + Math.floor((now.getMonth() + 20) / 12),
    defaultInstallment: 25000,
    dueDay: 10,
    gracePeriodDays: 5,
    defaultInterestRate: 2.0,
    lateFee: 100,
    status: ChitStatus.ACTIVE,
    notes: '',
  });

  const mutation = useMutation({
    mutationFn: () => chitsService.create(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chits'] });
      onClose();
    },
  });

  const handleTotalOrCapacityChange = (val: number, cap: number) => {
    const inst = Math.round(val / cap);
    setFormData((prev) => ({ ...prev, totalValue: val, capacity: cap, defaultInstallment: inst }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Chit Group" subtitle="Initialize scheme parameters and monthly schedule">
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Chit Code *</label>
            <input
              type="text"
              required
              placeholder="e.g. CHIT-5L-20M"
              value={formData.chitCode}
              onChange={(e) => setFormData({ ...formData, chitCode: e.target.value.toUpperCase() })}
              className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Scheme Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. 5 Lakhs 20M Group"
              value={formData.chitName}
              onChange={(e) => setFormData({ ...formData, chitName: e.target.value })}
              className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Total Value (₹) *</label>
            <input
              type="number"
              required
              value={formData.totalValue}
              onChange={(e) => handleTotalOrCapacityChange(+e.target.value, formData.capacity)}
              className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Capacity (Seats) *</label>
            <input
              type="number"
              required
              min={2}
              max={100}
              value={formData.capacity}
              onChange={(e) => handleTotalOrCapacityChange(formData.totalValue, +e.target.value)}
              className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Installment (₹)</label>
            <input
              type="number"
              value={formData.defaultInstallment}
              onChange={(e) => setFormData({ ...formData, defaultInstallment: +e.target.value })}
              className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Start / End Period */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase">Start Month</label>
            <input
              type="number"
              min={1}
              max={12}
              value={formData.startMonth}
              onChange={(e) => setFormData({ ...formData, startMonth: +e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase">Start Year</label>
            <input
              type="number"
              value={formData.startYear}
              onChange={(e) => setFormData({ ...formData, startYear: +e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase">End Month</label>
            <input
              type="number"
              min={1}
              max={12}
              value={formData.endMonth}
              onChange={(e) => setFormData({ ...formData, endMonth: +e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase">End Year</label>
            <input
              type="number"
              value={formData.endYear}
              onChange={(e) => setFormData({ ...formData, endYear: +e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
            />
          </div>
        </div>

        {/* Due Day & Grace & Interest */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase">Due Day of Month</label>
            <input
              type="number"
              min={1}
              max={28}
              value={formData.dueDay}
              onChange={(e) => setFormData({ ...formData, dueDay: +e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase">Grace Days</label>
            <input
              type="number"
              value={formData.gracePeriodDays}
              onChange={(e) => setFormData({ ...formData, gracePeriodDays: +e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase">Default Interest %</label>
            <input
              type="number"
              step="0.1"
              value={formData.defaultInterestRate}
              onChange={(e) => setFormData({ ...formData, defaultInterestRate: +e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-3">
          <Button variant="outline" className="flex-1" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            type="submit"
            isLoading={mutation.isPending}
            leftIcon={<Layers size={16} />}
          >
            Create Scheme
          </Button>
        </div>
      </form>
    </Modal>
  );
};
