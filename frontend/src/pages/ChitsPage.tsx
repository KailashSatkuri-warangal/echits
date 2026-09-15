import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layers, Plus, Search, Filter } from 'lucide-react';
import { chitsService } from '../services/chits.service';
import { ChitCard } from '../components/chits/ChitCard';
import { CreateChitModal } from '../components/chits/CreateChitModal';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { useAuth } from '../context/AuthContext';

export const ChitsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: chits = [], isLoading } = useQuery({
    queryKey: ['chits'],
    queryFn: () => chitsService.getAll(),
  });

  const filteredChits = chits.filter(
    (c) =>
      c.chitName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.chitCode.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Chit Schemes</h1>
          <p className="text-xs text-slate-500 font-medium">Manage active scheme groups, seat allocations, and month schedules</p>
        </div>

        {isAdmin && (
          <Button onClick={() => setIsCreateOpen(true)} leftIcon={<Plus size={16} />}>
            Create New Scheme
          </Button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Filter by scheme name or code (e.g. CHIT-5L-20M)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200/90 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-soft"
        />
      </div>

      {/* Chit Schemes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <>
            <Skeleton className="h-56 w-full" />
            <Skeleton className="h-56 w-full" />
          </>
        ) : filteredChits.length === 0 ? (
          <div className="col-span-2">
            <EmptyState
              icon={<Layers size={32} />}
              title="No chit schemes found"
              description="No chit scheme matched your filter. You can create a new scheme anytime."
              actionText={isAdmin ? 'Create Chit Scheme' : undefined}
              onAction={isAdmin ? () => setIsCreateOpen(true) : undefined}
            />
          </div>
        ) : (
          filteredChits.map((chit) => <ChitCard key={chit.id} chit={chit} />)
        )}
      </div>

      {/* Create Chit Modal */}
      <CreateChitModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
};
