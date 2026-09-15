import React from 'react';

interface CurrencyTextProps {
  amount: number | string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'muted';
  className?: string;
  showDecimals?: boolean;
}

export const CurrencyText: React.FC<CurrencyTextProps> = ({
  amount,
  size = 'md',
  variant = 'default',
  className = '',
  showDecimals = true,
}) => {
  const num = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;

  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(num);

  const sizeClasses = {
    sm: 'text-xs font-medium',
    md: 'text-sm font-semibold',
    lg: 'text-base font-bold',
    xl: 'text-lg font-extrabold',
    '2xl': 'text-2xl font-black tracking-tight',
    '3xl': 'text-3xl sm:text-4xl font-black tracking-tight',
  }[size];

  const variantClasses = {
    default: 'text-slate-900 dark:text-white',
    success: 'text-emerald-600 dark:text-emerald-400',
    danger: 'text-rose-600 dark:text-rose-400',
    warning: 'text-amber-600 dark:text-amber-400',
    muted: 'text-slate-500 dark:text-slate-400',
  }[variant];

  return (
    <span className={`font-mono inline-block ${sizeClasses} ${variantClasses} ${className}`}>
      {formatted}
    </span>
  );
};
