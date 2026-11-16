import React from 'react';
import { Artifact } from '../../types';
import { useIDEStore } from '../../engine/store';
import { Check, X, FileCode, Terminal, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '../primitives/Button';
import { Badge } from '../primitives/Badge';

interface ArtifactCardProps {
  artifact: Artifact;
}

export const ArtifactCard: React.FC<ArtifactCardProps> = ({ artifact }) => {
  const { approveArtifact, rejectArtifact } = useIDEStore();

  const getIcon = () => {
    switch (artifact.type) {
      case 'diff':
        return <FileCode className="w-4 h-4 text-accent-text" />;
      case 'plan':
        return <FileText className="w-4 h-4 text-warning" />;
      case 'terminal':
        return <Terminal className="w-4 h-4 text-turbo" />;
      default:
        return <FileText className="w-4 h-4 text-muted" />;
    }
  };

  return (
    <div className="my-3 rounded-lg border border-border bg-surface shadow-md overflow-hidden transition-all">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-surface-raised border-b border-border text-xs">
        <div className="flex items-center gap-2 font-medium text-text">
          {getIcon()}
          <span>{artifact.title}</span>
          {artifact.path && <Badge variant="default">{artifact.path}</Badge>}
        </div>
        <div className="flex items-center gap-2">
          {artifact.status === 'approved' && (
            <span className="flex items-center gap-1 text-success text-2xs font-semibold uppercase">
              <CheckCircle2 className="w-3.5 h-3.5" /> Approved
            </span>
          )}
          {artifact.status === 'rejected' && (
            <Badge variant="danger">Rejected</Badge>
          )}
          {artifact.status === 'pending' && (
            <Badge variant="warning">Review Required</Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 text-xs font-mono bg-bg/60 overflow-x-auto max-h-72">
        {artifact.type === 'diff' && artifact.diffAfter ? (
          <div className="flex flex-col gap-1">
            <div className="text-2xs text-muted mb-1">// Proposed Changes (Diff Patch):</div>
            <pre className="text-diff-add bg-diff-add-bg/60 p-2.5 rounded border border-diff-add/30 leading-relaxed whitespace-pre-wrap">
              {artifact.diffAfter}
            </pre>
          </div>
        ) : (
          <div className="text-text leading-relaxed whitespace-pre-wrap font-ui">
            {artifact.content}
          </div>
        )}
      </div>

      {/* Footer / Actions */}
      {artifact.status === 'pending' && (
        <div className="flex items-center justify-end gap-2 px-3 py-2 bg-surface-raised border-t border-border">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => rejectArtifact(artifact.id)}
            className="text-danger-text hover:bg-danger-bg/40"
          >
            <X className="w-3.5 h-3.5" /> Reject
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => approveArtifact(artifact.id)}
            className="bg-success text-on-success hover:bg-success/90"
          >
            <Check className="w-3.5 h-3.5" /> Approve Changes
          </Button>
        </div>
      )}
    </div>
  );
};
