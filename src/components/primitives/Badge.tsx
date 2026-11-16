import React from 'react';
import { clsx } from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'warning' | 'danger' | 'success' | 'turbo';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className }) => {
  const styles = {
    default: 'bg-surface-raised text-muted border border-border',
    accent: 'bg-accent/15 text-accent-text border border-accent/30',
    warning: 'bg-warning-bg text-warning border border-warning/40',
    danger: 'bg-danger-bg text-danger-text border border-danger/40',
    success: 'bg-success-bg text-success border border-success/40',
    turbo: 'bg-turbo-bg text-turbo border border-turbo/60 font-semibold',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center text-2xs px-2 py-0.5 rounded font-mono uppercase tracking-wider',
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};
