import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, XCircle, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';
import { DueStatus, ChitStatus, MembershipStatus } from '../../types';

interface BadgeProps {
  status: string | DueStatus | ChitStatus | MembershipStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusBadge: React.FC<BadgeProps> = ({ status, size = 'sm', className = '' }) => {
  const norm = (status || '').toUpperCase();

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2 font-semibold',
  }[size];

  const iconSize = size === 'lg' ? 16 : size === 'md' ? 14 : 12;

  switch (norm) {
    case 'PAID':
      return (
        <span className={`inline-flex items-center rounded-full font-medium bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 ${sizeClasses} ${className}`}>
          <CheckCircle2 size={iconSize} className="text-emerald-600 dark:text-emerald-400" />
          <span>PAID</span>
        </span>
      );

    case 'PART_PAID':
      return (
        <span className={`inline-flex items-center rounded-full font-medium bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800 ${sizeClasses} ${className}`}>
          <Clock size={iconSize} className="text-amber-600 dark:text-amber-400" />
          <span>PART PAID</span>
        </span>
      );

    case 'OVERDUE':
      return (
        <span className={`inline-flex items-center rounded-full font-medium bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800 ${sizeClasses} ${className}`}>
          <AlertTriangle size={iconSize} className="text-rose-600 dark:text-rose-400" />
          <span>OVERDUE</span>
        </span>
      );

    case 'PENDING':
      return (
        <span className={`inline-flex items-center rounded-full font-medium bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 ${sizeClasses} ${className}`}>
          <Clock size={iconSize} className="text-blue-600 dark:text-blue-400" />
          <span>PENDING</span>
        </span>
      );

    case 'WAIVED':
      return (
        <span className={`inline-flex items-center rounded-full font-medium bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800 ${sizeClasses} ${className}`}>
          <ShieldCheck size={iconSize} className="text-purple-600 dark:text-purple-400" />
          <span>WAIVED</span>
        </span>
      );

    case 'ACTIVE':
      return (
        <span className={`inline-flex items-center rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses} ${className}`}>
          <CheckCircle2 size={iconSize} className="text-emerald-500" />
          <span>ACTIVE</span>
        </span>
      );

    case 'LIFTED':
      return (
        <span className={`inline-flex items-center rounded-full font-medium bg-indigo-100 text-indigo-800 border border-indigo-300 ${sizeClasses} ${className}`}>
          <UserCheck size={iconSize} className="text-indigo-600" />
          <span>LIFTED</span>
        </span>
      );

    case 'SUSPENDED':
    case 'CANCELLED':
      return (
        <span className={`inline-flex items-center rounded-full font-medium bg-slate-200 text-slate-700 border border-slate-300 ${sizeClasses} ${className}`}>
          <XCircle size={iconSize} className="text-slate-500" />
          <span>{norm}</span>
        </span>
      );

    default:
      return (
        <span className={`inline-flex items-center rounded-full font-medium bg-slate-100 text-slate-800 border border-slate-200 ${sizeClasses} ${className}`}>
          <AlertCircle size={iconSize} className="text-slate-500" />
          <span>{norm}</span>
        </span>
      );
  }
};
