import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Search } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { chitsService } from '../../services/chits.service';
import { membersService } from '../../services/members.service';

interface EnrollMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  chitId: string;
  nextAvailableSeat: number;
}

export const EnrollMemberModal: React.FC<EnrollMemberModalProps> = ({
  isOpen,
  onClose,
  chitId,
  nextAvailableSeat,
}) => {
  const queryClient = useQueryClient();
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [seatNumber, setSeatNumber] = useState(nextAvailableSeat);
  const [customInstallment, setCustomInstallment] = useState('');
  const [openingBalance, setOpeningBalance] = useState('0');

  // Existing member search
  const { data: searchResults } = useQuery({
    queryKey: ['memberSearchEnroll', memberSearch],
    queryFn: () => membersService.search(memberSearch),
    enabled: isOpen && !selectedMemberId,
  });

  const mutation = useMutation({
    mutationFn: () =>
      chitsService.enrollMember({
        chitId,
        memberId: selectedMemberId,
        seatNumber: +seatNumber,
        customInstallment: customInstallment ? +customInstallment : undefined,
        openingBalance: +openingBalance,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chit360', chitId] });
      queryClient.invalidateQueries({ queryKey: ['chits'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) return;
    mutation.mutate();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Enroll Member into Chit Seat" subtitle="Assign a member to a vacant seat">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Step 1: Select Member */}
        {!selectedMemberId ? (
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Search & Select Member *</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search member by name or mobile..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto mt-2">
              {searchResults?.items?.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setSelectedMemberId(m.id)}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all cursor-pointer flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900">{m.fullName}</span>
                    <span className="text-slate-500 ml-2 font-mono">{m.phone}</span>
                  </div>
                  <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-semibold text-slate-700">
                    {m.memberCode}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-emerald-950">Selected Member</span>
              <div className="text-emerald-700 font-mono text-[11px]">{selectedMemberId}</div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedMemberId('')}
              className="text-emerald-800 font-bold hover:underline"
            >
              Change
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Seat Number *</label>
            <input
              type="number"
              required
              min={1}
              value={seatNumber}
              onChange={(e) => setSeatNumber(+e.target.value)}
              className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Opening Balance (₹)</label>
            <input
              type="number"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            disabled={!selectedMemberId}
            leftIcon={<UserPlus size={16} />}
          >
            Enroll Seat
          </Button>
        </div>
      </form>
    </Modal>
  );
};
