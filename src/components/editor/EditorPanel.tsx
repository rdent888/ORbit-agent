import React from 'react';
import Editor from '@monaco-editor/react';
import { useIDEStore } from '../../engine/store';
import { X, FileCode } from 'lucide-react';
import { clsx } from 'clsx';

export const EditorPanel: React.FC = () => {
  const { openFiles, activeFilePath, fileContents, openFile, closeFile, updateFileContent } =
    useIDEStore();

  const currentContent = activeFilePath ? fileContents[activeFilePath] || '' : '';

  // Infer language from extension
  const getLanguage = (path: string | null) => {
    if (!path) return 'typescript';
    if (path.endsWith('.ts') || path.endsWith('.tsx')) return 'typescript';
    if (path.endsWith('.js') || path.endsWith('.jsx')) return 'javascript';
    if (path.endsWith('.json')) return 'json';
    if (path.endsWith('.md')) return 'markdown';
    return 'plaintext';
  };

  return (
    <div className="flex flex-col h-full bg-bg border-r border-border overflow-hidden">
      {/* File Tabs Header */}
      <div className="flex items-center bg-bg-sidebar border-b border-border overflow-x-auto select-none h-9">
        {openFiles.map((path) => {
          const fileName = path.split('/').pop() || path;
          const isActive = activeFilePath === path;
          return (
            <div
              key={path}
              onClick={() => openFile(path)}
              className={clsx(
                'flex items-center gap-2 px-3 py-1.5 text-xs border-r border-border cursor-pointer transition-colors max-w-[200px] h-full group',
                isActive
                  ? 'bg-bg text-text border-t-2 border-t-accent font-medium'
                  : 'bg-bg-sidebar text-muted hover:bg-surface hover:text-text'
              )}
            >
              <FileCode className={clsx('w-3.5 h-3.5 shrink-0', isActive ? 'text-accent-text' : 'text-muted')} />
              <span className="truncate">{fileName}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeFile(path);
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-surface-raised text-muted hover:text-text ml-auto"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Monaco Code Editor */}
      <div className="flex-1 w-full h-full relative">
        {activeFilePath ? (
          <Editor
            height="100%"
            theme="vs-dark"
            language={getLanguage(activeFilePath)}
            value={currentContent}
            onChange={(val) => updateFileContent(activeFilePath, val || '')}
            options={{
              fontSize: 13,
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
              lineNumbers: 'on',
              renderWhitespace: 'selection',
              glyphMargin: false,
              folding: true,
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted text-xs gap-2">
            <FileCode className="w-8 h-8 opacity-40 text-accent" />
            <span>Pilih file dari explorer atau minta agent untuk mengedit kode.</span>
          </div>
        )}
      </div>
    </div>
  );
};
