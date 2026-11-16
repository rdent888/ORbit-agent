import React from 'react';
import { clsx } from 'clsx';

export type AgentStatusType = 'idle' | 'thinking' | 'running' | 'error' | 'stalled';

interface StatusDotProps {
  status: AgentStatusType;
  label?: string;
  className?: string;
}

export const StatusDot: React.FC<StatusDotProps> = ({ status, label, className }) => {
  const dotColors = {
    idle: 'bg-agent-idle',
    thinking: 'bg-agent-thinking animate-pulse ring-2 ring-agent-thinking/40',
    running: 'bg-success animate-pulse ring-2 ring-success/40',
    error: 'bg-agent-error',
    stalled: 'bg-warning ring-2 ring-warning/40',
  };

  const textColors = {
    idle: 'text-muted',
    thinking: 'text-accent-text font-medium',
    running: 'text-success font-medium',
    error: 'text-danger-text',
    stalled: 'text-warning',
  };

  return (
    <div className={clsx('inline-flex items-center gap-1.5 text-xs', className)}>
      <span className={clsx('w-2 h-2 rounded-full transition-all duration-300', dotColors[status])} />
      {label && <span className={textColors[status]}>{label}</span>}
    </div>
  );
};
