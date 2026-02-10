import type { StateMachineModel } from '../model/types';
import { exportTests } from '../exporters/testExporter';

const API_KEY_STORAGE_KEY = 'vsmb-anthropic-api-key';

export function getStoredApiKey(): string | null {
  try {
    return localStorage.getItem(API_KEY_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredApiKey(key: string | null): void {
  try {
    if (key) localStorage.setItem(API_KEY_STORAGE_KEY, key);
    else localStorage.removeItem(API_KEY_STORAGE_KEY);
  } catch {}
}

export interface AnalysisIssue {
  type: 'warning' | 'error';
  message: string;
  stateId?: string;
}

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  apply?: () => void;
}

export interface AIService {
  analyze(machine: StateMachineModel): Promise<AnalysisIssue[]>;
  suggest(machine: StateMachineModel): Promise<Suggestion[]>;
  generateTests(machine: StateMachineModel): Promise<string>;
  explain(machine: StateMachineModel): Promise<string>;
}

function analyzeLocal(model: StateMachineModel): AnalysisIssue[] {
  const issues: AnalysisIssue[] = [];
  const hasOutgoing = new Set(model.transitions.map((t) => t.fromStateId));
  const reachable = new Set<string>([model.initialStateId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const t of model.transitions) {
      if (reachable.has(t.fromStateId) && !reachable.has(t.toStateId)) {
        reachable.add(t.toStateId);
        changed = true;
      }
    }
  }
  for (const s of model.states) {
    if (!hasOutgoing.has(s.id)) {
      issues.push({ type: 'warning', message: `State "${s.label}" has no outgoing transitions (dead-end).`, stateId: s.id });
    }
    if (!reachable.has(s.id)) {
      issues.push({ type: 'error', message: `State "${s.label}" is unreachable from the initial state.`, stateId: s.id });
    }
  }
  const labels = new Set(model.states.map((s) => s.label.toLowerCase()));
  if (labels.has('loading') && !model.transitions.some((t) => t.event.toLowerCase().includes('timeout') || t.event.toLowerCase().includes('abort'))) {
    issues.push({ type: 'warning', message: 'Consider adding a loading timeout or abort handling.' });
  }
  if (labels.has('error') && !model.transitions.some((t) => t.event.toLowerCase().includes('retry'))) {
    issues.push({ type: 'warning', message: 'Consider adding a retry transition from the error state.' });
  }
  return issues;
}

function suggestLocal(model: StateMachineModel): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const labels = new Set(model.states.map((s) => s.label.toLowerCase()));
  if (!labels.has('loading') && (labels.has('idle') || labels.has('success'))) {
    suggestions.push({
      id: 'add-loading',
      title: 'Add loading state',
      description: 'Insert a loading state between idle and success/error for async flows.',
    });
  }
  if (labels.has('loading') && !labels.has('error')) {
    suggestions.push({
      id: 'add-error',
      title: 'Add error state',
      description: 'Handle failures with a dedicated error state and retry.',
    });
  }
  const hasOutgoing = new Set(model.transitions.map((t) => t.fromStateId));
  for (const s of model.states) {
    if (!hasOutgoing.has(s.id)) {
      suggestions.push({
        id: `outgoing-${s.id}`,
        title: `Add outgoing transition from "${s.label}"`,
        description: 'This state has no outgoing transitions; consider adding one (e.g. reset, retry).',
      });
    }
  }
  return suggestions.slice(0, 5);
}

export const aiService: AIService = {
  async analyze(machine) {
    return analyzeLocal(machine);
  },
  async suggest(machine) {
    return suggestLocal(machine);
  },
  async generateTests(machine) {
    return exportTests(machine);
  },
  async explain(machine) {
    const lines: string[] = [
      `# ${machine.name}`,
      '',
      '## Overview',
      `This state machine has ${machine.states.length} states and ${machine.transitions.length} transitions.`,
      '',
      '## States',
      ...machine.states.map((s) => `- **${s.label}**${s.id === machine.initialStateId ? ' (initial)' : ''}`),
      '',
      '## Transitions',
    ];
    const byId = new Map(machine.states.map((s) => [s.id, s]));
    for (const t of machine.transitions) {
      const from = byId.get(t.fromStateId)?.label ?? t.fromStateId;
      const to = byId.get(t.toStateId)?.label ?? t.toStateId;
      lines.push(`- ${from} --[${t.event}]--> ${to}`);
    }
    return lines.join('\n');
  },
};
