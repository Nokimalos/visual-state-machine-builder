import { useState, useRef, useEffect } from 'react';
import type { StateMachineModel } from '../model/types';
import { getHistory, type HistoryEntry } from '../utils/diagramHistory';
import { SHORTCUTS_LIST } from '../hooks/useKeyboardShortcuts';
import { ExportMenu } from './ExportMenu';

export interface ToolbarProps {
  model: StateMachineModel;
  machineName: string;
  sharedFromUrl?: boolean;
  onShare: () => void;
  onImportFromCode: () => void;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  onNameChange: (name: string) => void;
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAsTemplate: () => void;
  onOpenFromHistory: (model: StateMachineModel) => void;
  onCopyCode: () => void;
  onDownload: () => void;
  onCopySnippetForAgent: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onLayout: () => void;
  onOpenAIPanel: () => void;
  canUndo: boolean;
  canRedo: boolean;
  validationErrors: string[];
}

function formatHistoryDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function Toolbar({
  model,
  machineName,
  sharedFromUrl: _sharedFromUrl,
  onShare,
  onImportFromCode,
  canvasRef,
  onNameChange,
  onNew,
  onOpen,
  onSave,
  onSaveAsTemplate,
  onOpenFromHistory,
  onCopyCode,
  onDownload,
  onCopySnippetForAgent,
  onUndo,
  onRedo,
  onLayout,
  onOpenAIPanel,
  canUndo,
  canRedo,
  validationErrors,
}: ToolbarProps) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const historyRef = useRef<HTMLDivElement>(null);
  const shortcutsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (historyOpen) setHistoryEntries(getHistory());
  }, [historyOpen]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(e.target as Node)) setHistoryOpen(false);
      if (shortcutsRef.current && !shortcutsRef.current.contains(e.target as Node)) setShortcutsOpen(false);
    };
    if (historyOpen || shortcutsOpen) {
      document.addEventListener('click', handler);
      return () => document.removeEventListener('click', handler);
    }
  }, [historyOpen, shortcutsOpen]);

  return (
    <header className="sticky top-0 z-10 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]/95 backdrop-blur supports-[backdrop-filter]:bg-[hsl(var(--card))]/80">
      <div className="mx-auto flex max-w-[1800px] flex-col gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-[hsl(var(--muted-foreground))] hidden md:inline">
            Visual State Machine Builder
          </span>
          <label className="sr-only" htmlFor="machine-name">
            Machine name (used in generated code)
          </label>
          <input
            id="machine-name"
            type="text"
            className="h-9 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-1.5 font-medium text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--ring))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/20"
            value={machineName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="e.g. FetchUserState"
          />
          <span className="text-xs text-[hsl(var(--muted-foreground))] hidden sm:inline">
            Name used for types and exports
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg border border-[hsl(var(--border))] bg-transparent px-3 py-1.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/30 disabled:opacity-50"
              onClick={onNew}
              title="Start a new empty diagram (Ctrl+N)"
            >
              New
            </button>
            <button
              type="button"
              className="rounded-lg border border-[hsl(var(--border))] bg-transparent px-3 py-1.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/30"
              onClick={onOpen}
              title="Open a saved .vsmb.json or .json diagram"
            >
              Open
            </button>
            <button
              type="button"
              className="rounded-lg border border-[hsl(var(--border))] bg-transparent px-3 py-1.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/30"
              onClick={onImportFromCode}
              title="Import state machine from React code"
            >
              Import from code
            </button>
            <button
              type="button"
              className="rounded-lg border border-[hsl(var(--border))] bg-transparent px-3 py-1.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/30 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={onShare}
              title="Copy shareable link to clipboard"
              disabled={model.states.length === 0}
            >
              Share
            </button>
            <button
              type="button"
              className="rounded-lg border border-[hsl(var(--border))] bg-transparent px-3 py-1.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/30"
              onClick={onSave}
              title="Save diagram as JSON to re-open later"
            >
              Save
            </button>
            <button
              type="button"
              className="rounded-lg border border-[hsl(var(--border))] bg-transparent px-3 py-1.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/30"
              onClick={onSaveAsTemplate}
              title="Save current diagram as a reusable template"
            >
              Save as template
            </button>
            <button
              type="button"
              className="rounded-lg border border-[hsl(var(--border))] bg-transparent px-3 py-1.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/30 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={onLayout}
              title="Reorganize diagram (left → right flow)"
              disabled={model.states.length === 0}
            >
              Reorganize
            </button>
            <div className="relative" ref={historyRef}>
              <button
                type="button"
                className="rounded-lg border border-[hsl(var(--border))] bg-transparent px-3 py-1.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/30"
                onClick={() => setHistoryOpen((v) => !v)}
                title="Open a diagram from app history"
                aria-expanded={historyOpen}
                aria-haspopup="true"
              >
                History
              </button>
              {historyOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 max-h-64 w-72 overflow-auto rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] py-1 shadow-xl">
                  {historyEntries.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-[hsl(var(--muted-foreground))]">
                      No history yet. Save a diagram to add it here.
                    </p>
                  ) : (
                    historyEntries.map((entry) => (
                      <button
                        key={entry.id}
                        type="button"
                        className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-[hsl(var(--border))] focus:bg-[hsl(var(--border))] focus:outline-none"
                        onClick={() => {
                          onOpenFromHistory(entry.model);
                          setHistoryOpen(false);
                        }}
                      >
                        <span className="font-medium text-[hsl(var(--foreground))]">{entry.name}</span>
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">
                          {formatHistoryDate(entry.updatedAt)} · {entry.model.states.length} states
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              className="rounded-lg border border-[hsl(var(--border))] bg-transparent px-2.5 py-1.5 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/30 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo last change"
              aria-label="Undo"
            >
              ↶ Undo
            </button>
            <button
              type="button"
              className="rounded-lg border border-[hsl(var(--border))] bg-transparent px-2.5 py-1.5 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/30 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo"
              aria-label="Redo"
            >
              ↷ Redo
            </button>
            <button
              type="button"
              className="rounded-lg border border-[hsl(var(--border))] bg-transparent px-2.5 py-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--border))] hover:text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/30"
              onClick={onOpenAIPanel}
              title="AI Assistant"
              aria-label="Open AI Assistant"
            >
              ✨
            </button>
            <div className="relative" ref={shortcutsRef}>
              <button
                type="button"
                className="rounded-lg border border-[hsl(var(--border))] bg-transparent px-2.5 py-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--border))] hover:text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/30"
                onClick={() => setShortcutsOpen((v) => !v)}
                title="Keyboard shortcuts"
                aria-label="Keyboard shortcuts"
              >
                ?
              </button>
              {shortcutsOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] py-2 shadow-xl">
                  <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    Shortcuts
                  </p>
                  {SHORTCUTS_LIST.map(({ keys, description }) => (
                    <div key={keys} className="flex justify-between gap-4 px-3 py-1 text-xs">
                      <kbd className="font-mono text-[hsl(var(--foreground))]">{keys}</kbd>
                      <span className="text-[hsl(var(--muted-foreground))]">{description}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2" data-tour-export>
          <ExportMenu
            model={model}
            validationValid={validationErrors.length === 0}
            validationError={validationErrors[0]}
            canvasRef={canvasRef}
            onCopyCode={onCopyCode}
            onDownloadCode={onDownload}
            onCopySnippetForAgent={onCopySnippetForAgent}
          />
          {validationErrors.length > 0 && (
            <ul className="ml-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[hsl(var(--destructive))]" role="alert">
              {validationErrors.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </header>
  );
}
