import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import { Search, UserPlus, Users, Phone, MessageCircle } from 'lucide-react';
import { membersService } from '../services/members.service';
import { MemberSearchCard } from '../components/members/MemberSearchCard';
import { CreateMemberModal } from '../components/members/CreateMemberModal';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { MemberSummary } from '../types';

export const MembersPage: React.FC = () => {
  const { openPaymentDrawer } = useOutletContext<{ openPaymentDrawer: (params?: any) => void }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['members', searchQuery],
    queryFn: () => membersService.search(searchQuery),
  });

  const members = data?.items || [];

  const handleRecordPayment = (member: MemberSummary, chitId?: string) => {
    openPaymentDrawer({ memberId: member.id, chitId });
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Members & Accounts</h1>
          <p className="text-xs text-slate-500 font-medium">Search members, track multi-chit balances, and initiate collections</p>
        </div>

        <Button
          onClick={() => setIsAddMemberOpen(true)}
          leftIcon={<UserPlus size={16} />}
        >
          Add New Member
        </Button>
      </div>

      {/* Fast Global Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Search by Member Name, Mobile Number, or Member Code (e.g. MEM-1001)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200/90 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-soft text-slate-900"
          autoFocus
        />
      </div>

      {/* Members List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : members.length === 0 ? (
          <EmptyState
            icon={<Users size={32} />}
            title="No members found"
            description="No customer records matched your search query. You can add a new member directly."
            actionText="Add New Member"
            onAction={() => setIsAddMemberOpen(true)}
          />
        ) : (
          members.map((member) => (
            <MemberSearchCard
              key={member.id}
              member={member}
              onRecordPayment={handleRecordPayment}
            />
          ))
        )}
      </div>

      {/* Add Member Modal */}
      <CreateMemberModal isOpen={isAddMemberOpen} onClose={() => setIsAddMemberOpen(false)} />
    </div>
  );
};
