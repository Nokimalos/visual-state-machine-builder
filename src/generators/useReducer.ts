import type { StateMachineModel, StateNode, OutputLanguage } from '../model/types';

function stateToStatusLiteral(state: StateNode): string {
  const label = state.label.replace(/'/g, "\\'");
  return `'${label}'`;
}

function defaultContextForState(state: StateNode): string {
  if (!state.contextSchema || Object.keys(state.contextSchema).length === 0) {
    return '';
  }
  const parts = Object.entries(state.contextSchema).map(([key, type]) => {
    if (type === 'string') return `${key}: ''`;
    if (type === 'number') return `${key}: 0`;
    if (type === 'boolean') return `${key}: false`;
    return `${key}: undefined as ${type}`;
  });
  return ', ' + parts.join(', ');
}

export function generateUseReducer(model: StateMachineModel, language: OutputLanguage = 'ts'): string {
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

  const eventNames = [...new Set(model.transitions.map((t) => t.event))];
  const actionTypeMembers = eventNames
    .map((event) => {
      const transitionsForEvent = model.transitions.filter((t) => t.event === event);
      const withPayload = transitionsForEvent.some((t) => {
        const toState = model.states.find((s) => s.id === t.toStateId);
        return toState?.contextSchema && Object.keys(toState.contextSchema).length > 0;
      });
      if (withPayload) {
        const toState = transitionsForEvent[0]
          ? model.states.find((s) => s.id === transitionsForEvent[0].toStateId)
          : null;
        const payloadType =
          toState?.contextSchema && Object.keys(toState.contextSchema).length > 0
            ? '{ ' +
              Object.entries(toState.contextSchema)
                .map(([k, v]) => `${k}: ${v}`)
                .join('; ') +
              ' }'
            : 'void';
        return `  | { type: '${event}'; payload: ${payloadType} }`;
      }
      return `  | { type: '${event}' }`;
    })
    .join('\n');

  const initial = model.states.find((s) => s.id === model.initialStateId);
  const initialState =
    initial &&
    `{ status: ${stateToStatusLiteral(initial)}${defaultContextForState(initial)} }`;

  const cases = eventNames.map((event) => {
    const t = model.transitions.find((tr) => tr.event === event)!;
    const to = model.states.find((s) => s.id === t.toStateId)!;
    const payloadAssign =
      to.contextSchema && Object.keys(to.contextSchema).length > 0
        ? Object.keys(to.contextSchema)
            .map((k) => `        ${k}: action.payload.${k}`)
            .join(',\n')
        : '';
    const payloadSpread = payloadAssign ? `,\n${payloadAssign}` : '';
    return `    case '${event}':
      return { status: ${stateToStatusLiteral(to)}${payloadSpread} };`;
  });

  const machineName = model.name.replace(/\s+/g, '') || 'StateMachine';
  const reducerName = machineName.charAt(0).toLowerCase() + machineName.slice(1) + 'Reducer';

  if (!isTs) {
    return `// Generated State Machine: ${model.name}
// Format: useReducer (JavaScript)

export function ${reducerName}(state, action) {
  switch (action.type) {
${cases.join('\n')}
    default:
      return state;
  }
}

export const initial${machineName}State = ${initialState ?? '{ status: \'idle\' }'};

// Usage in component:
// const [state, dispatch] = useReducer(${reducerName}, initial${machineName}State);
`;
  }

  return `// Generated State Machine: ${model.name}
// Format: useReducer

export type ${machineName}State =
${stateTypeMembers};

export type ${machineName}Action =
${actionTypeMembers};

export function ${reducerName}(
  state: ${machineName}State,
  action: ${machineName}Action
): ${machineName}State {
  switch (action.type) {
${cases.join('\n')}
    default:
      return state;
  }
}

export const initial${machineName}State: ${machineName}State = ${initialState ?? '{ status: \'idle\' }'};

// Usage in component:
// const [state, dispatch] = useReducer(${reducerName}, initial${machineName}State);
`;
}
