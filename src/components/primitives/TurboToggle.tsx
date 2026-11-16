import React from 'react';
import { useIDEStore } from '../../engine/store';
import { Zap, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';

export const TurboToggle: React.FC = () => {
  const { turboMode, setTurboMode } = useIDEStore();

  return (
    <button
      onClick={() => setTurboMode(!turboMode)}
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-all cursor-pointer',
        turboMode
          ? 'bg-turbo-bg text-turbo border-turbo/60 shadow-sm shadow-turbo/20 ring-1 ring-turbo/40'
          : 'bg-surface text-muted border-border hover:bg-surface-hover'
      )}
      title={
        turboMode
          ? 'Turbo Mode ON: Full local filesystem & hardware access. Terminal commands run unsandboxed.'
          : 'Turbo Mode OFF: Sandboxed within workspace boundary.'
      }
    >
      <Zap className={clsx('w-3.5 h-3.5', turboMode ? 'fill-turbo text-turbo animate-pulse' : 'text-muted')} />
      <span>Turbo {turboMode ? 'ON' : 'OFF'}</span>
      {turboMode ? (
        <span className="text-2xs bg-turbo/20 text-turbo px-1 py-0.2 rounded font-mono">DEV ACCESS</span>
      ) : (
        <ShieldCheck className="w-3 h-3 text-muted" />
      )}
    </button>
  );
};
