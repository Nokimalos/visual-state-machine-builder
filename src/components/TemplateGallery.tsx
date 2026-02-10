import { useState, useEffect } from 'react';
import type { StateMachineModel, StateNode, Transition } from '../model/types';
import { v4 as uuidv4 } from 'uuid';
import { getUserTemplates, removeUserTemplate, type UserTemplate } from '../utils/userTemplates';

export interface Template {
  id: string;
  name: string;
  description: string;
  model: StateMachineModel;
}

function buildTemplate(
  name: string,
  states: Array<{ label: string; type?: StateNode['type']; contextSchema?: Record<string, string> }>,
  transitions: Array<{ from: string; to: string; event: string }>,
  initialLabel: string
): StateMachineModel {
  const stateIds = states.map(() => uuidv4());
  const stateNodes: StateNode[] = states.map((s, i) => ({
    id: stateIds[i],
    label: s.label,
    type: s.type,
    contextSchema: s.contextSchema,
  }));
  const byLabel = Object.fromEntries(stateNodes.map((s) => [s.label, s.id]));
  const initialId = byLabel[initialLabel] ?? stateNodes[0]?.id ?? '';
  const transitionsList: Transition[] = transitions.map((t) => ({
    id: uuidv4(),
    fromStateId: byLabel[t.from],
    toStateId: byLabel[t.to],
    event: t.event,
  }));
  return {
    name,
    initialStateId: initialId,
    states: stateNodes,
    transitions: transitionsList,
    outputFormat: 'useReducer',
  };
}

export const TEMPLATES: Template[] = [
  {
    id: 'async-fetch',
    name: 'Async fetch',
    description: 'idle → loading → success | error, with RETRY',
    model: buildTemplate(
      'AsyncFetch',
      [
        { label: 'idle', type: 'idle' },
        { label: 'loading', type: 'loading' },
        { label: 'success', type: 'success', contextSchema: { data: 'T' } },
        { label: 'error', type: 'error', contextSchema: { error: 'string' } },
      ],
      [
        { from: 'idle', to: 'loading', event: 'FETCH' },
        { from: 'loading', to: 'success', event: 'SUCCESS' },
        { from: 'loading', to: 'error', event: 'ERROR' },
        { from: 'error', to: 'loading', event: 'RETRY' },
      ],
      'idle'
    ),
  },
  {
    id: 'list-with-empty',
    name: 'List with empty',
    description: 'idle, loading, success (data), empty, error',
    model: buildTemplate(
      'ListState',
      [
        { label: 'idle', type: 'idle' },
        { label: 'loading', type: 'loading' },
        { label: 'success', type: 'success', contextSchema: { data: 'T[]' } },
        { label: 'empty', type: 'empty' },
        { label: 'error', type: 'error', contextSchema: { error: 'string' } },
      ],
      [
        { from: 'idle', to: 'loading', event: 'FETCH' },
        { from: 'loading', to: 'success', event: 'SUCCESS' },
        { from: 'loading', to: 'empty', event: 'EMPTY' },
        { from: 'loading', to: 'error', event: 'ERROR' },
        { from: 'error', to: 'loading', event: 'RETRY' },
      ],
      'idle'
    ),
  },
  {
    id: 'form-submit',
    name: 'Form submit',
    description: 'idle, submitting, success, error',
    model: buildTemplate(
      'FormSubmit',
      [
        { label: 'idle', type: 'idle' },
        { label: 'submitting', type: 'loading' },
        { label: 'success', type: 'success' },
        { label: 'error', type: 'error', contextSchema: { error: 'string' } },
      ],
      [
        { from: 'idle', to: 'submitting', event: 'SUBMIT' },
        { from: 'submitting', to: 'success', event: 'SUCCESS' },
        { from: 'submitting', to: 'error', event: 'ERROR' },
        { from: 'error', to: 'idle', event: 'DISMISS' },
      ],
      'idle'
    ),
  },
  {
    id: 'pagination',
    name: 'Pagination',
    description: 'idle, loading, success, error; PREV_PAGE, NEXT_PAGE',
    model: buildTemplate(
      'Pagination',
      [
        { label: 'idle', type: 'idle' },
        { label: 'loading', type: 'loading' },
        { label: 'success', type: 'success', contextSchema: { data: 'T[]', page: 'number' } },
        { label: 'error', type: 'error', contextSchema: { error: 'string' } },
      ],
      [
        { from: 'idle', to: 'loading', event: 'FETCH' },
        { from: 'loading', to: 'success', event: 'SUCCESS' },
        { from: 'loading', to: 'error', event: 'ERROR' },
        { from: 'success', to: 'loading', event: 'NEXT_PAGE' },
        { from: 'success', to: 'loading', event: 'PREV_PAGE' },
        { from: 'error', to: 'loading', event: 'RETRY' },
      ],
      'idle'
    ),
  },
  {
    id: 'auth-flow',
    name: 'Authentication flow',
    description: 'loggedOut, loggingIn, loggedIn, sessionExpired',
    model: buildTemplate(
      'AuthFlow',
      [
        { label: 'loggedOut', type: 'idle' },
        { label: 'loggingIn', type: 'loading' },
        { label: 'loggedIn', type: 'success' },
        { label: 'sessionExpired', type: 'error' },
      ],
      [
        { from: 'loggedOut', to: 'loggingIn', event: 'LOGIN' },
        { from: 'loggingIn', to: 'loggedIn', event: 'SUCCESS' },
        { from: 'loggingIn', to: 'loggedOut', event: 'ERROR' },
        { from: 'loggedIn', to: 'loggedOut', event: 'LOGOUT' },
        { from: 'loggedIn', to: 'sessionExpired', event: 'SESSION_EXPIRED' },
        { from: 'sessionExpired', to: 'loggingIn', event: 'LOGIN' },
      ],
      'loggedOut'
    ),
  },
  {
    id: 'multi-step-form',
    name: 'Multi-step form',
    description: 'step1 → step2 → step3, submitting, success, error',
    model: buildTemplate(
      'MultiStepForm',
      [
        { label: 'step1', type: 'idle' },
        { label: 'step2', type: 'idle' },
        { label: 'step3', type: 'idle' },
        { label: 'submitting', type: 'loading' },
        { label: 'success', type: 'success' },
        { label: 'error', type: 'error', contextSchema: { error: 'string' } },
      ],
      [
        { from: 'step1', to: 'step2', event: 'NEXT' },
        { from: 'step2', to: 'step1', event: 'PREV' },
        { from: 'step2', to: 'step3', event: 'NEXT' },
        { from: 'step3', to: 'step2', event: 'PREV' },
        { from: 'step3', to: 'submitting', event: 'SUBMIT' },
        { from: 'submitting', to: 'success', event: 'SUCCESS' },
        { from: 'submitting', to: 'error', event: 'ERROR' },
        { from: 'error', to: 'step3', event: 'DISMISS' },
      ],
      'step1'
    ),
  },
  {
    id: 'websocket',
    name: 'WebSocket connection',
    description: 'disconnected, connecting, connected, reconnecting',
    model: buildTemplate(
      'WebSocket',
      [
        { label: 'disconnected', type: 'idle' },
        { label: 'connecting', type: 'loading' },
        { label: 'connected', type: 'success' },
        { label: 'reconnecting', type: 'loading' },
      ],
      [
        { from: 'disconnected', to: 'connecting', event: 'CONNECT' },
        { from: 'connecting', to: 'connected', event: 'CONNECTED' },
        { from: 'connecting', to: 'disconnected', event: 'ERROR' },
        { from: 'connected', to: 'disconnected', event: 'DISCONNECT' },
        { from: 'connected', to: 'reconnecting', event: 'RECONNECT' },
        { from: 'reconnecting', to: 'connected', event: 'CONNECTED' },
        { from: 'reconnecting', to: 'disconnected', event: 'ERROR' },
      ],
      'disconnected'
    ),
  },
  {
    id: 'file-upload',
    name: 'File upload with progress',
    description: 'idle, uploading, progress, success, error',
    model: buildTemplate(
      'FileUpload',
      [
        { label: 'idle', type: 'idle' },
        { label: 'uploading', type: 'loading' },
        { label: 'progress', type: 'loading', contextSchema: { percent: 'number' } },
        { label: 'success', type: 'success' },
        { label: 'error', type: 'error', contextSchema: { error: 'string' } },
      ],
      [
        { from: 'idle', to: 'uploading', event: 'UPLOAD' },
        { from: 'uploading', to: 'progress', event: 'PROGRESS' },
        { from: 'progress', to: 'success', event: 'SUCCESS' },
        { from: 'progress', to: 'error', event: 'ERROR' },
        { from: 'uploading', to: 'error', event: 'ERROR' },
        { from: 'error', to: 'idle', event: 'RETRY' },
      ],
      'idle'
    ),
  },
  {
    id: 'infinite-scroll',
    name: 'Infinite scroll',
    description: 'idle, loading, success, loadingMore, error',
    model: buildTemplate(
      'InfiniteScroll',
      [
        { label: 'idle', type: 'idle' },
        { label: 'loading', type: 'loading' },
        { label: 'success', type: 'success', contextSchema: { items: 'T[]' } },
        { label: 'loadingMore', type: 'loading' },
        { label: 'error', type: 'error', contextSchema: { error: 'string' } },
      ],
      [
        { from: 'idle', to: 'loading', event: 'FETCH' },
        { from: 'loading', to: 'success', event: 'SUCCESS' },
        { from: 'loading', to: 'error', event: 'ERROR' },
        { from: 'success', to: 'loadingMore', event: 'LOAD_MORE' },
        { from: 'loadingMore', to: 'success', event: 'SUCCESS' },
        { from: 'loadingMore', to: 'error', event: 'ERROR' },
        { from: 'error', to: 'loading', event: 'RETRY' },
      ],
      'idle'
    ),
  },
  {
    id: 'optimistic-updates',
    name: 'Optimistic updates',
    description: 'idle, updating, success, rollback, error',
    model: buildTemplate(
      'OptimisticUpdates',
      [
        { label: 'idle', type: 'idle' },
        { label: 'updating', type: 'loading' },
        { label: 'success', type: 'success' },
        { label: 'rollback', type: 'error' },
        { label: 'error', type: 'error', contextSchema: { error: 'string' } },
      ],
      [
        { from: 'idle', to: 'updating', event: 'UPDATE' },
        { from: 'updating', to: 'success', event: 'SUCCESS' },
        { from: 'updating', to: 'rollback', event: 'FAIL' },
        { from: 'updating', to: 'error', event: 'ERROR' },
        { from: 'rollback', to: 'idle', event: 'DISMISS' },
        { from: 'error', to: 'idle', event: 'DISMISS' },
      ],
      'idle'
    ),
  },
  {
    id: 'shopping-cart',
    name: 'Shopping cart',
    description: 'empty, loading, ready, updating, checkout',
    model: buildTemplate(
      'ShoppingCart',
      [
        { label: 'empty', type: 'empty' },
        { label: 'loading', type: 'loading' },
        { label: 'ready', type: 'success', contextSchema: { items: 'CartItem[]' } },
        { label: 'updating', type: 'loading' },
        { label: 'checkout', type: 'success' },
      ],
      [
        { from: 'empty', to: 'loading', event: 'LOAD' },
        { from: 'loading', to: 'ready', event: 'SUCCESS' },
        { from: 'loading', to: 'empty', event: 'EMPTY' },
        { from: 'ready', to: 'updating', event: 'UPDATE_ITEM' },
        { from: 'updating', to: 'ready', event: 'SUCCESS' },
        { from: 'ready', to: 'checkout', event: 'CHECKOUT' },
        { from: 'checkout', to: 'empty', event: 'DONE' },
      ],
      'empty'
    ),
  },
  {
    id: 'video-player',
    name: 'Video player states',
    description: 'idle, loading, playing, paused, ended, error',
    model: buildTemplate(
      'VideoPlayer',
      [
        { label: 'idle', type: 'idle' },
        { label: 'loading', type: 'loading' },
        { label: 'playing', type: 'success' },
        { label: 'paused', type: 'idle' },
        { label: 'ended', type: 'success' },
        { label: 'error', type: 'error', contextSchema: { error: 'string' } },
      ],
      [
        { from: 'idle', to: 'loading', event: 'LOAD' },
        { from: 'loading', to: 'playing', event: 'READY' },
        { from: 'loading', to: 'error', event: 'ERROR' },
        { from: 'playing', to: 'paused', event: 'PAUSE' },
        { from: 'paused', to: 'playing', event: 'PLAY' },
        { from: 'playing', to: 'ended', event: 'END' },
        { from: 'ended', to: 'playing', event: 'REPLAY' },
        { from: 'error', to: 'loading', event: 'RETRY' },
      ],
      'idle'
    ),
  },
];

function formatTemplateDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export interface TemplateGalleryProps {
  onSelect: (model: StateMachineModel) => void;
  userTemplatesVersion?: number;
}

export function TemplateGallery({ onSelect, userTemplatesVersion = 0 }: TemplateGalleryProps) {
  const [userTemplates, setUserTemplates] = useState<UserTemplate[]>([]);

  useEffect(() => {
    setUserTemplates(getUserTemplates());
  }, [userTemplatesVersion]);

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    removeUserTemplate(id);
    setUserTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="template-gallery">
      <div className="flex items-center gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
          Start from a template
        </h3>
        <span className="text-xs text-[hsl(var(--muted-foreground))]">
          — or add states and connect them on the canvas
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            className="flex flex-col items-start rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3 text-left transition hover:border-[hsl(var(--accent))]/50 hover:bg-[hsl(var(--accent))]/5 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/30"
            onClick={() => onSelect(JSON.parse(JSON.stringify(t.model)))}
            title={`Load "${t.name}" diagram`}
          >
            <span className="font-medium text-[hsl(var(--foreground))]">{t.name}</span>
            <span className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
              {t.description}
            </span>
          </button>
        ))}
      </div>
      {userTemplates.length > 0 && (
        <div className="mt-4 border-t border-[hsl(var(--border))] pt-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            My templates
          </h3>
          <div className="flex flex-wrap gap-2">
            {userTemplates.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] pr-2"
              >
                <button
                  type="button"
                  className="flex flex-col items-start px-4 py-3 text-left transition hover:border-[hsl(var(--accent))]/50 hover:bg-[hsl(var(--accent))]/5 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/30 rounded-l-xl border-0"
                  onClick={() => onSelect(JSON.parse(JSON.stringify(t.model)))}
                  title={`Load "${t.name}"`}
                >
                  <span className="font-medium text-[hsl(var(--foreground))]">{t.name}</span>
                  <span className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                    {formatTemplateDate(t.createdAt)}
                  </span>
                </button>
                <button
                  type="button"
                  className="rounded p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--destructive))]/10 hover:text-[hsl(var(--destructive))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/30"
                  onClick={(e) => handleRemove(e, t.id)}
                  title="Remove template"
                  aria-label={`Remove ${t.name}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
