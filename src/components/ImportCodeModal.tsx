import { useState, useCallback } from 'react';
import { parseReactComponent } from '../services/codeParser';
import type { StateMachineModel } from '../model/types';

export interface ImportCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (model: StateMachineModel) => void;
}

const PLACEHOLDER = `// Paste React component code with useState or useReducer
// Example:
// const [status, setStatus] = useState('idle');
// if (status === 'loading') return <Spinner />;
`;

export function ImportCodeModal({ isOpen, onClose, onImport }: ImportCodeModalProps) {
  const [code, setCode] = useState('');
  const [preview, setPreview] = useState<StateMachineModel | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleParse = useCallback(() => {
    setError(null);
    setPreview(null);
    if (!code.trim()) return;
    const model = parseReactComponent(code);
    if (model) {
      setPreview(model);
    } else {
      setError('Could not detect states. Try code with useState(\'idle\') or useReducer.');
    }
  }, [code]);

  const handleImport = useCallback(() => {
    if (preview) {
      onImport(preview);
      onClose();
    }
  }, [preview, onImport, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-code-title"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        aria-hidden
      />
      <div className="relative w-full max-w-2xl rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-xl flex flex-col max-h-[90vh]">
        <div className="border-b border-[hsl(var(--border))] px-4 py-3">
          <h2 id="import-code-title" className="text-lg font-semibold text-[hsl(var(--foreground))]">
            Import from code
          </h2>
          <p className="mt-0.5 text-sm text-[hsl(var(--muted-foreground))]">
            Paste React code with useState or useReducer. States and transitions will be inferred.
          </p>
        </div>
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <textarea
            className="m-4 flex-1 min-h-[200px] w-[calc(100%-2rem)] rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 font-mono text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--ring))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/20"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={PLACEHOLDER}
            aria-label="React code"
          />
          <div className="px-4 flex gap-2">
            <button
              type="button"
              className="rounded-lg border border-[hsl(var(--border))] bg-transparent px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/30"
              onClick={handleParse}
            >
              Parse / Preview
            </button>
            {preview && (
              <button
                type="button"
                className="rounded-lg bg-[hsl(var(--accent))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/30"
                onClick={handleImport}
              >
                Import
              </button>
            )}
            <button
              type="button"
              className="rounded-lg border border-[hsl(var(--border))] bg-transparent px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/30 ml-auto"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
          {error && (
            <p className="px-4 py-2 text-sm text-[hsl(var(--destructive))]" role="alert">
              {error}
            </p>
          )}
          {preview && (
            <div className="px-4 pb-4 text-sm text-[hsl(var(--muted-foreground))]">
              Preview: {preview.states.length} states, {preview.transitions.length} transitions. Initial: {preview.states.find((s) => s.id === preview.initialStateId)?.label ?? '—'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
