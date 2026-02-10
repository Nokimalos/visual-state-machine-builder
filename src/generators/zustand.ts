import type { StateMachineModel, StateNode, OutputLanguage } from '../model/types';

function stateToStatusLiteral(state: StateNode): string {
  const label = state.label.replace(/'/g, "\\'");
  return `'${label}'`;
}

export function generateZustand(model: StateMachineModel, language: OutputLanguage = 'ts'): string {
  const isTs = language === 'ts';
  const stateTypeMembers = model.states
    .map((s) => {
      const base = `  | { status: ${stateToStatusLiteral(s)}`;
      if (s.contextSchema && Object.keys(s.contextSchema).length > 0) {
        const ctx = Object.entries(s.contextSchema)
          .map(([k, v]) => `    ${k}: ${v}`)
          .join(';\n');
        return `${base};\n${ctx} }`;
      }
      return base + ' }';
    })
    .join('\n');

  const initial = model.states.find((s) => s.id === model.initialStateId);
  const defaultContext = (s: StateNode): string => {
    if (!s.contextSchema || Object.keys(s.contextSchema).length === 0) return '';
    return Object.entries(s.contextSchema)
      .map(([key, type]) => {
        if (type === 'string') return `${key}: ''`;
        if (type === 'number') return `${key}: 0`;
        if (type === 'boolean') return `${key}: false`;
        return `${key}: undefined as ${type}`;
      })
      .join(', ');
  };
  const initialCtx = initial ? defaultContext(initial) : '';
  const initialStateStr = initial
    ? `{ status: ${stateToStatusLiteral(initial)}${initialCtx ? ', ' + initialCtx : ''} }`
    : '{ status: \'idle\' }';

  const machineName = model.name.replace(/\s+/g, '') || 'StateMachine';

  const seenEvents = new Set<string>();
  const actionEntries: string[] = [];
  for (const t of model.transitions) {
    if (seenEvents.has(t.event)) continue;
    seenEvents.add(t.event);
    const to = model.states.find((s) => s.id === t.toStateId)!;
    const hasPayload = to.contextSchema && Object.keys(to.contextSchema).length > 0;
    const actionName = t.event.charAt(0).toLowerCase() + t.event.slice(1);
    const payloadParams = hasPayload
      ? 'payload: { ' +
        Object.entries(to.contextSchema!)
          .map(([k, v]) => `${k}: ${v}`)
          .join('; ') +
        ' }'
      : '';
    const setPayload = hasPayload
      ? ', ' +
        Object.keys(to.contextSchema!)
          .map((k) => `${k}: payload.${k}`)
          .join(', ')
      : '';
    actionEntries.push(
      `  ${actionName}: ${payloadParams ? `(${payloadParams}) =>` : '() =>'} set(() => ({ status: ${stateToStatusLiteral(to)}${setPayload} }))`
    );
  }

  const actionSignatures = actionEntries.map((entry) => {
    const match = entry.match(/^\s*(\w+):/);
    const name = match ? match[1] : 'dispatch';
    const hasPayload = entry.includes('payload:');
    return hasPayload ? `  ${name}: (payload: unknown) => void` : `  ${name}: () => void`;
  });

  if (!isTs) {
    return `// Generated State Machine: ${model.name}
// Format: Zustand (JavaScript)

import { create } from 'zustand';

export const use${machineName}Store = create((set) => ({
  ...${initialStateStr},
${actionEntries.join(',\n')}
}));

// Usage: use${machineName}Store.getState().fetch() etc. for events;
// use${machineName}Store((s) => s.status) for reactive state.
`;
  }

  return `// Generated State Machine: ${model.name}
// Format: Zustand (store simulates state machine with status + actions)

import { create } from 'zustand';

export type ${machineName}State =
${stateTypeMembers};

interface ${machineName}Store extends ${machineName}State {
${actionSignatures.join(';\n')}
}

export const use${machineName}Store = create<${machineName}Store>()((set) => ({
  ...(${initialStateStr} as ${machineName}State),
${actionEntries.join(',\n')}
}));

// Usage: use${machineName}Store.getState().fetch() etc. for events;
// use${machineName}Store((s) => s.status) for reactive state.
`;
}
