import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'turbo';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 focus:ring-offset-bg disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

  const variants = {
    primary: 'bg-accent text-on-accent hover:bg-accent-hover shadow-sm',
    secondary: 'bg-surface border border-border text-text hover:bg-surface-hover shadow-sm',
    ghost: 'bg-transparent text-muted hover:bg-surface hover:text-text',
    danger: 'bg-danger text-on-danger hover:opacity-90 shadow-sm',
    turbo: 'bg-turbo-bg text-turbo border border-turbo/60 hover:bg-turbo/20 font-semibold shadow-sm',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1 h-7 gap-1.5',
    md: 'text-sm px-3.5 py-1.5 h-8 gap-2',
    lg: 'text-base px-4 py-2 h-10 gap-2.5',
  };

  return (
    <button
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};
