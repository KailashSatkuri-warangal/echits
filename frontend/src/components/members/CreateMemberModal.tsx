import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { membersService } from '../../services/members.service';

interface CreateMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateMemberModal: React.FC<CreateMemberModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    altPhone: '',
    email: '',
    address: '',
    idProofType: 'AADHAAR',
    idProofNumber: '',
    notes: '',
  });

  const mutation = useMutation({
    mutationFn: () => membersService.create(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['memberSearch'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.phone.trim()) return;
    mutation.mutate();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Member" subtitle="Register a new customer for chit schemes">
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Full Name *</label>
          <input
            type="text"
            required
            placeholder="e.g. Suresh Gowda"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Mobile Number *</label>
            <input
              type="tel"
              required
              placeholder="e.g. 9845012345"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Alt Phone</label>
            <input
              type="tel"
              placeholder="e.g. 9845099999"
              value={formData.altPhone}
              onChange={(e) => setFormData({ ...formData, altPhone: e.target.value })}
              className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Email Address</label>
          <input
            type="email"
            placeholder="e.g. suresh@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Address</label>
          <textarea
            rows={2}
            placeholder="Residential or business address..."
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">ID Proof Type</label>
            <select
              value={formData.idProofType}
              onChange={(e) => setFormData({ ...formData, idProofType: e.target.value })}
              className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="AADHAAR">Aadhaar Card</option>
              <option value="PAN">PAN Card</option>
              <option value="VOTER_ID">Voter ID</option>
              <option value="PASSPORT">Passport</option>
              <option value="DRIVING_LICENSE">Driving License</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">ID Proof Number</label>
            <input
              type="text"
              placeholder="e.g. 1234-5678-9012"
              value={formData.idProofNumber}
              onChange={(e) => setFormData({ ...formData, idProofNumber: e.target.value })}
              className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
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
            leftIcon={<UserPlus size={16} />}
          >
            Create Member
          </Button>
        </div>
      </form>
    </Modal>
  );
};
