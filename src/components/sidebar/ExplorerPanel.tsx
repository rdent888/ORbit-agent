import React from 'react';
import { useIDEStore } from '../../engine/store';
import { FolderOpen, FileCode, FileText } from 'lucide-react';
import { WorkspaceFile } from '../../types';
import { clsx } from 'clsx';

export const ExplorerPanel: React.FC = () => {
  const { files, activeFilePath, openFile, workspacePath } = useIDEStore();

  const renderItem = (item: WorkspaceFile, depth: number = 0) => {
    const isSelected = activeFilePath === item.path;

    if (item.type === 'directory') {
      return (
        <div key={item.path} className="flex flex-col">
          <div
            className="flex items-center gap-1.5 px-2 py-1 text-xs text-text/90 font-medium hover:bg-surface cursor-pointer select-none"
            style={{ paddingLeft: `${depth * 14 + 8}px` }}
          >
            <FolderOpen className="w-3.5 h-3.5 text-accent-text shrink-0" />
            <span className="truncate">{item.name}</span>
          </div>
          {item.children?.map((child) => renderItem(child, depth + 1))}
        </div>
      );
    }

    return (
      <div
        key={item.path}
        onClick={() => openFile(item.path)}
        className={clsx(
          'flex items-center gap-1.5 px-2 py-1 text-xs cursor-pointer select-none transition-colors group',
          isSelected ? 'bg-surface text-accent-text font-semibold' : 'text-text/80 hover:bg-surface hover:text-text'
        )}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
      >
        {item.name.endsWith('.md') ? (
          <FileText className="w-3.5 h-3.5 text-muted shrink-0" />
        ) : (
          <FileCode className={clsx('w-3.5 h-3.5 shrink-0', isSelected ? 'text-accent-text' : 'text-muted')} />
        )}
        <span className="truncate">{item.name}</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-surface-raised border-r border-border select-none">
      <div className="px-3.5 py-2.5 text-2xs font-bold text-muted uppercase tracking-wider border-b border-border flex items-center justify-between">
        <span>Explorer</span>
        <span className="text-2xs font-mono text-muted truncate max-w-[120px]">{workspacePath.split('/').pop()}</span>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {files.map((file) => renderItem(file))}
      </div>
    </div>
  );
};
