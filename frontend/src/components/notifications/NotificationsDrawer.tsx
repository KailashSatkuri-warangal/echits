import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, RefreshCw, AlertTriangle, Clock, Layers, UserCheck } from 'lucide-react';
import { BottomSheet } from '../ui/BottomSheet';
import { notificationsService } from '../../services/notifications.service';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsService.getAll(),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const refreshMutation = useMutation({
    mutationFn: () => notificationsService.refresh(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const handleItemClick = (notif: any) => {
    notificationsService.markAsRead(notif.id).then(() => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    try {
      const meta = notif.metadataJson ? JSON.parse(notif.metadataJson) : null;
      if (meta?.memberId) {
        navigate(`/members/${meta.memberId}`);
        onClose();
      } else if (meta?.chitId) {
        navigate(`/chits/${meta.chitId}`);
        onClose();
      }
    } catch (e) {
      // Ignore
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'DUE_TODAY':
        return <Clock className="text-blue-500" size={18} />;
      case 'OVERDUE':
        return <AlertTriangle className="text-rose-500" size={18} />;
      case 'MULTI_CHIT_PENDING':
        return <Layers className="text-amber-500" size={18} />;
      case 'LIFT_PENDING':
        return <UserCheck className="text-emerald-500" size={18} />;
      default:
        return <Bell className="text-slate-500" size={18} />;
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Attention & Notifications" subtitle="Real-time operational alerts">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
        <Button
          variant="outline"
          size="sm"
          onClick={() => refreshMutation.mutate()}
          isLoading={refreshMutation.isPending}
          leftIcon={<RefreshCw size={14} />}
        >
          Scan Alerts
        </Button>

        {notifications.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllMutation.mutate()}
            isLoading={markAllMutation.isPending}
            leftIcon={<Check size={14} />}
          >
            Mark All Read
          </Button>
        )}
      </div>

      <div className="space-y-2.5 max-h-[60vh] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">
            <Bell className="mx-auto text-slate-300 mb-2" size={32} />
            No active notifications. All dues are up to date.
          </div>
        ) : (
          notifications.map((n: any) => (
            <div
              key={n.id}
              onClick={() => handleItemClick(n)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex gap-3 ${
                n.isRead
                  ? 'bg-white border-slate-200 text-slate-600'
                  : 'bg-emerald-50/40 border-emerald-200 text-slate-900 shadow-sm'
              }`}
            >
              <div className="mt-0.5">{getCategoryIcon(n.category)}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                <div className="text-[10px] text-slate-400 mt-1.5 font-medium">
                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </BottomSheet>
  );
};
