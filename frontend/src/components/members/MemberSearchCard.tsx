import React from 'react';
import { Phone, MessageCircle, IndianRupee, Eye, ChevronRight, Layers } from 'lucide-react';
import { MemberSummary } from '../../types';
import { CurrencyText } from '../ui/CurrencyText';
import { StatusBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';

interface MemberSearchCardProps {
  member: MemberSummary;
  onRecordPayment: (member: MemberSummary, chitId?: string) => void;
}

export const MemberSearchCard: React.FC<MemberSearchCardProps> = ({ member, onRecordPayment }) => {
  const navigate = useNavigate();

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`tel:${member.phone}`, '_self');
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const phone = member.phone.replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('91') ? phone : `91${phone}`;
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  return (
    <div
      onClick={() => navigate(`/members/${member.id}`)}
      className="bg-white rounded-2xl border border-slate-200/90 shadow-soft p-4 hover:border-emerald-400 transition-all cursor-pointer space-y-3"
    >
      {/* Header Info */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-slate-900 text-base">{member.fullName}</h3>
            <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">
              {member.memberCode}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
            <span className="font-mono">{member.phone}</span>
            {member.address && <span className="truncate max-w-[150px] sm:max-w-xs">{member.address}</span>}
          </div>
        </div>

        <StatusBadge status={member.status} size="sm" />
      </div>

      {/* Multi-Chit Aggregate Summary */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Outstanding</div>
          <CurrencyText amount={member.totalOutstanding} size="lg" variant={member.totalOutstanding > 0 ? 'danger' : 'success'} />
        </div>

        <div className="text-right">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Enrolled Chits</div>
          <div className="flex items-center gap-1.5 justify-end mt-0.5">
            <Layers size={14} className="text-slate-500" />
            <span className="text-xs font-bold text-slate-800">{member.chitsCount} Chits</span>
            {member.pendingChitsCount > 1 && (
              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                {member.pendingChitsCount} Pending
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Chit-wise breakdown (if member belongs to multiple chits) */}
      {member.chits && member.chits.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Chit Schemes Breakdown
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {member.chits.map((c) => (
              <div
                key={c.chitId}
                className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50/70 rounded-lg text-xs border border-slate-100"
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-800">{c.chitCode}</span>
                  <span className="text-[10px] text-slate-400">Seat {c.seatNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CurrencyText amount={c.pendingAmount} size="sm" variant={c.pendingAmount > 0 ? 'danger' : 'success'} />
                  {c.pendingAmount > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRecordPayment(member, c.chitId);
                      }}
                      className="p-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800"
                      title="Pay this chit"
                    >
                      <IndianRupee size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions Bar */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCall}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
            title="Call Member"
          >
            <Phone size={15} />
          </button>
          <button
            onClick={handleWhatsApp}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-emerald-50 text-emerald-600 transition-colors"
            title="Message on WhatsApp"
          >
            <MessageCircle size={15} />
          </button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/members/${member.id}`);
            }}
            rightIcon={<ChevronRight size={14} />}
          >
            360° Profile
          </Button>
        </div>

        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onRecordPayment(member);
          }}
          leftIcon={<IndianRupee size={14} />}
        >
          Collect
        </Button>
      </div>
    </div>
  );
};
