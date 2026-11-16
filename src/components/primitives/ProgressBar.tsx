import React from 'react';
import { clsx } from 'clsx';

interface ProgressBarProps {
  used: number;
  limit: number;
  label?: string;
  sublabel?: string;
  showPercent?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  used,
  limit,
  label,
  sublabel,
  showPercent = true,
  className,
}) => {
  const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  const barColor =
    percent >= 90
      ? 'bg-danger'
      : percent >= 70
      ? 'bg-warning'
      : 'bg-accent';

  return (
    <div className={clsx('w-full flex flex-col gap-1', className)}>
      {(label || showPercent) && (
        <div className="flex justify-between items-center text-xs">
          {label && <span className="text-text font-medium truncate">{label}</span>}
          {showPercent && (
            <span
              className={clsx(
                'text-2xs font-mono font-semibold',
                percent >= 90 ? 'text-danger-text' : percent >= 70 ? 'text-warning' : 'text-muted'
              )}
            >
              {limit > 0 ? `${used.toLocaleString()} / ${limit.toLocaleString()} tokens (${percent}%)` : `${used.toLocaleString()} tokens used`}
            </span>
          )}
        </div>
      )}
      <div className="w-full h-1.5 bg-surface-raised rounded-full overflow-hidden">
        <div
          className={clsx('h-full transition-all duration-300 rounded-full', barColor)}
          style={{ width: `${percent}%` }}
        />
      </div>
      {sublabel && <span className="text-2xs text-muted font-mono">{sublabel}</span>}
    </div>
  );
};
