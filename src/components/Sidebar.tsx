import { useState } from 'react';
import type {
  StateMachineModel,
  StateNode as StateNodeType,
  StateNodeType as StateNodeTypeOption,
  OutputFormat,
  OutputLanguage,
} from '../model/types';

const STATE_TYPES: StateNodeTypeOption[] = [
  'idle',
  'loading',
  'success',
  'error',
  'empty',
  'custom',
];

const FORMAT_HINTS: Record<OutputFormat, string> = {
  'useReducer': 'React hook, no extra deps',
  'XState': 'Statecharts, useMachine()',
  'Zustand': 'Store with status + actions',
  'TanStack Query': 'useQuery wrapper, async state',
};

export interface SidebarProps {
  model: StateMachineModel;
  snapToGrid?: boolean;
  onSnapToGridChange?: (value: boolean) => void;
  onAddState: () => void;
  onUpdateState: (id: string, payload: Partial<StateNodeType>) => void;
  onRemoveState: (id: string) => void;
  onSetInitialState: (id: string) => void;
  onUpdateTransitionEvent: (id: string, event: string) => void;
  onRemoveTransition: (id: string) => void;
  onOutputFormatChange: (format: OutputFormat) => void;
  onOutputLanguageChange?: (language: OutputLanguage) => void;
}

export function Sidebar({
  model,
  snapToGrid = false,
  onSnapToGridChange,
  onAddState,
  onUpdateState,
  onRemoveState,
  onSetInitialState,
  onUpdateTransitionEvent,
  onRemoveTransition,
  onOutputFormatChange,
  onOutputLanguageChange,
}: SidebarProps) {
  const [editingStateId, setEditingStateId] = useState<string | null>(null);
  const [editingTransitionId, setEditingTransitionId] = useState<string | null>(null);

  return (
    <aside data-tour-sidebar className="flex w-72 flex-shrink-0 flex-col border-l border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-y-auto">
      <div className="sticky top-0 z-10 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3">
        <h2 data-tour-output-format className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
          Output format
        </h2>
        <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
          {FORMAT_HINTS[model.outputFormat]}
        </p>
        <select
          className="mt-2 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:border-[hsl(var(--ring))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/20"
          value={model.outputFormat}
          onChange={(e) => onOutputFormatChange(e.target.value as OutputFormat)}
          aria-label="Generated code format"
        >
          <option value="useReducer">useReducer</option>
          <option value="XState">XState</option>
          <option value="Zustand">Zustand</option>
          <option value="TanStack Query">TanStack Query</option>
        </select>
        {onOutputLanguageChange && (
          <>
            <h2 className="mt-3 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              Output language
            </h2>
            <select
              className="mt-1 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:border-[hsl(var(--ring))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/20"
              value={model.outputLanguage ?? 'ts'}
              onChange={(e) => onOutputLanguageChange(e.target.value as OutputLanguage)}
              aria-label="TypeScript or JavaScript"
            >
              <option value="ts">TypeScript</option>
              <option value="js">JavaScript</option>
            </select>
          </>
        )}
        {onSnapToGridChange != null && (
          <>
            <h2 className="mt-3 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              Canvas
            </h2>
            <label className="mt-2 flex items-center gap-2 text-sm text-[hsl(var(--foreground))]">
              <input
                type="checkbox"
                checked={snapToGrid}
                onChange={(e) => onSnapToGridChange(e.target.checked)}
                className="rounded border-[hsl(var(--border))]"
              />
              Snap to grid (20px)
            </label>
          </>
        )}
      </div>

      <section className="border-b border-[hsl(var(--border))] px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              States
            </h3>
            <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
              UI states (idle, loading, success, error…)
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg bg-[hsl(var(--accent))] px-2.5 py-1.5 text-xs font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/30"
            onClick={onAddState}
            title="Add a new state node"
          >
            + Add
          </button>
        </div>
        <ul className="mt-3 space-y-1">
          {model.states.map((s) => (
            <li
              key={s.id}
              className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-2"
            >
              {editingStateId === s.id ? (
                <div
                  className="edit-state-block"
                  onBlur={(e) => {
                    const el = e.currentTarget;
                    if (!el.contains(document.activeElement)) {
                      setEditingStateId(null);
                    }
                  }}
                >
                  <input
                    className="w-full rounded border border-[hsl(var(--border))] bg-transparent px-2 py-1 text-sm focus:border-[hsl(var(--ring))] focus:outline-none"
                    value={s.label}
                    onChange={(e) => onUpdateState(s.id, { label: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingStateId(null)}
                    autoFocus
                    aria-label="State label"
                  />
                  <select
                    className="mt-2 w-full rounded border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1.5 text-xs text-[hsl(var(--foreground))] focus:border-[hsl(var(--ring))] focus:outline-none"
                    value={s.type ?? 'custom'}
                    onChange={(e) =>
                      onUpdateState(s.id, { type: e.target.value as StateNodeTypeOption })
                    }
                    onKeyDown={(e) => e.key === 'Escape' && setEditingStateId(null)}
                    aria-label="State type"
                  >
                    {STATE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <span
                    className="flex cursor-pointer items-center gap-1.5 text-sm font-medium"
                    onClick={() => setEditingStateId(s.id)}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingStateId(s.id)}
                    role="button"
                    tabIndex={0}
                    title="Click to edit label and type"
                  >
                    {s.label}
                    {s.id === model.initialStateId && (
                      <span className="rounded bg-[hsl(var(--accent))]/20 px-1.5 py-0.5 text-[10px] font-medium text-[hsl(var(--accent))]">
                        initial
                      </span>
                    )}
                  </span>
                  <div className="mt-2 flex gap-1">
                    {s.id !== model.initialStateId && (
                      <button
                        type="button"
                        className="rounded border border-[hsl(var(--border))] px-2 py-0.5 text-xs text-[hsl(var(--foreground))] hover:bg-[hsl(var(--border))] focus:outline-none"
                        onClick={() => onSetInitialState(s.id)}
                      >
                        Set initial
                      </button>
                    )}
                    <button
                      type="button"
                      className="rounded border border-[hsl(var(--destructive))]/50 px-2 py-0.5 text-xs text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/10 focus:outline-none"
                      onClick={() => onRemoveState(s.id)}
                    >
                      Remove
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex-1 px-4 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
          Transitions
        </h3>
        <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
          Event name = action type (e.g. FETCH_SUCCESS, RETRY)
        </p>
        <ul className="mt-3 space-y-1">
          {model.transitions.map((t) => {
            const from = model.states.find((s) => s.id === t.fromStateId);
            const to = model.states.find((s) => s.id === t.toStateId);
            return (
              <li
                key={t.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-2 text-xs"
              >
                {editingTransitionId === t.id ? (
                  <input
                    className="min-w-0 flex-1 rounded border border-[hsl(var(--border))] bg-transparent px-2 py-1 font-mono focus:border-[hsl(var(--ring))] focus:outline-none"
                    value={t.event}
                    onChange={(e) => onUpdateTransitionEvent(t.id, e.target.value)}
                    onBlur={() => setEditingTransitionId(null)}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingTransitionId(null)}
                    autoFocus
                    placeholder="EVENT_NAME"
                  />
                ) : (
                  <>
                    <span
                      className="min-w-0 flex-1 cursor-pointer font-mono"
                      onClick={() => setEditingTransitionId(t.id)}
                      onKeyDown={(e) => e.key === 'Enter' && setEditingTransitionId(t.id)}
                      role="button"
                      tabIndex={0}
                      title="Click to edit event name"
                    >
                      {from?.label} — <strong className="text-[hsl(var(--accent))]">{t.event}</strong> → {to?.label}
                    </span>
                    <button
                      type="button"
                      className="rounded px-1.5 py-0.5 text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/10 focus:outline-none"
                      onClick={() => onRemoveTransition(t.id)}
                      aria-label={`Remove transition ${t.event}`}
                    >
                      Remove
                    </button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </aside>
  );
}
