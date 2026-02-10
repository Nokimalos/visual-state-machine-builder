import type { StateMachineModel } from '../model/types';
import { generateUseReducer } from '../generators/useReducer';
import { generateXState } from '../generators/xstate';
import { generateZustand } from '../generators/zustand';
import { generateTanStackQuery } from '../generators/tanstackQuery';

export function generateCode(model: StateMachineModel): string {
  const lang = model.outputLanguage ?? 'ts';
  switch (model.outputFormat) {
    case 'useReducer':
      return generateUseReducer(model, lang);
    case 'XState':
      return generateXState(model, lang);
    case 'Zustand':
      return generateZustand(model, lang);
    case 'TanStack Query':
      return generateTanStackQuery(model, lang);
    default:
      return generateUseReducer(model, lang);
  }
}

function getEdgeCaseHints(model: StateMachineModel): string[] {
  const hints: string[] = [];
  const labels = new Set(model.states.map((s) => s.label.toLowerCase()));
  if (labels.has('loading')) hints.push('Consider adding a loading timeout and abort handling.');
  if (labels.has('error')) hints.push('Consider retry/backoff and user-facing error messages.');
  if (labels.has('empty')) hints.push('Consider a refresh or CTA to trigger a new load.');
  if (labels.has('success')) hints.push('Consider cache invalidation or refetch on window focus if data can go stale.');
  return hints;
}

function getSuggestions(model: StateMachineModel): string[] {
  const suggestions: string[] = [];
  const stateIds = new Set(model.states.map((s) => s.id));
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
    if (!hasOutgoing.has(s.id) && stateIds.has(s.id)) {
      suggestions.push(`State "${s.label}" has no outgoing transitions (possible sink state).`);
    }
    if (!reachable.has(s.id)) {
      suggestions.push(`State "${s.label}" is unreachable from the initial state.`);
    }
  }
  return suggestions;
}

export function generateSnippetForAgent(model: StateMachineModel): string {
  const code = generateCode(model);
  const initialLabel = model.states.find((s) => s.id === model.initialStateId)?.label ?? '';
  const edgeCases = getEdgeCaseHints(model);
  const suggestions = getSuggestions(model);

  const sections = [
    'You are refactoring or implementing a React component. Below is the state machine design and the generated code. Use it to implement or improve the UI state handling.',
    '',
    '## State machine: ' + model.name,
    '',
    '### States',
    model.states.map((s) => `- ${s.label}${s.id === model.initialStateId ? ' (initial)' : ''}`).join('\n'),
    '',
    '### Transitions',
    ...model.transitions.map(
      (t) =>
        `- ${model.states.find((s) => s.id === t.fromStateId)?.label} --[${t.event}]--> ${model.states.find((s) => s.id === t.toStateId)?.label}`
    ),
    '',
    '### Initial state',
    initialLabel,
    '',
  ];

  if (edgeCases.length > 0) {
    sections.push('### Edge cases to consider', '');
    edgeCases.forEach((h) => sections.push('- ' + h));
    sections.push('', '');
  }

  if (suggestions.length > 0) {
    sections.push('### Suggestions', '');
    suggestions.forEach((s) => sections.push('- ' + s));
    sections.push('', '');
  }

  sections.push('### Generated code', '', '```ts', code, '```');

  return sections.join('\n');
}

export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
