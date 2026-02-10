import type { StateMachineModel, StateNode, OutputLanguage } from '../model/types';

function stateToKey(state: StateNode): string {
  return state.label.replace(/\s+/g, '_').replace(/'/g, '');
}

export function generateXState(model: StateMachineModel, language: OutputLanguage = 'ts'): string {
  const isTs = language === 'ts';
  const hasContext = model.states.some(
    (s) => s.contextSchema && Object.keys(s.contextSchema).length > 0
  );

  const contextType =
    hasContext
      ? model.states
          .filter((s) => s.contextSchema && Object.keys(s.contextSchema).length > 0)
          .flatMap((s) => Object.entries(s.contextSchema ?? {}))
          .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {} as Record<string, string>)
      : null;

  const contextTypeStr = contextType && Object.keys(contextType).length > 0
    ? 'interface Context {\n  ' +
      Object.entries(contextType)
        .map(([k, v]) => `${k}: ${v}`)
        .join(';\n  ') +
      ';\n}\n\n'
    : '';

  const eventNames = [...new Set(model.transitions.map((t) => t.event))];
  const eventsType =
    'type Events =\n  ' +
    eventNames
      .map((e) => {
        const toStates = model.transitions.filter((t) => t.event === e);
        const withPayload = toStates.some((t) => {
          const s = model.states.find((st) => st.id === t.toStateId);
          return s?.contextSchema && Object.keys(s.contextSchema).length > 0;
        });
        if (withPayload) {
          const first = model.states.find((s) => s.id === toStates[0]?.toStateId);
          const payload =
            first?.contextSchema && Object.keys(first.contextSchema).length > 0
              ? '{ ' +
                Object.entries(first.contextSchema)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join('; ') +
                ' }'
              : 'void';
          return `| { type: '${e}'; payload: ${payload} }`;
        }
        return `| { type: '${e}' }`;
      })
      .join('\n  ') +
    ';\n\n';

  const initialKey = stateToKey(model.states.find((s) => s.id === model.initialStateId)!);
  const statesConfig = model.states
    .map((s) => {
      const key = stateToKey(s);
      const onTransitions = model.transitions
        .filter((t) => t.fromStateId === s.id)
        .map((t) => {
          const target = stateToKey(model.states.find((st) => st.id === t.toStateId)!);
          return `        '${t.event}': '${target}'`;
        })
        .join(',\n');
      return `      ${key}: {\n        on: {\n${onTransitions}\n        }\n      }`;
    })
    .join(',\n');

  const machineName = model.name.replace(/\s+/g, '') || 'StateMachine';

  if (!isTs) {
    const contextInit = contextTypeStr && contextType
      ? '{ ' + Object.keys(contextType).map((k) => `${k}: undefined`).join(', ') + ' }'
      : '{}';
    return `// Generated State Machine: ${model.name}
// Format: XState v5 (JavaScript)

import { createMachine } from 'xstate';

export const ${machineName}Machine = createMachine({
  id: '${model.name}',
  initial: '${initialKey}',
  context: ${contextInit},
  states: {
${statesConfig}
  }
});

// Usage with React:
// import { useMachine } from '@xstate/react';
// const [state, send] = useMachine(${machineName}Machine);
`;
  }

  return `// Generated State Machine: ${model.name}
// Format: XState v5

import { createMachine } from 'xstate';

${contextTypeStr}${eventsType}export const ${machineName}Machine = createMachine({
  id: '${model.name}',
  initial: '${initialKey}',
  types: {} as {
    context: ${contextTypeStr ? 'Context' : 'Record<string, never>'};
    events: Events;
  },
  context: ${contextTypeStr ? '{ ' + Object.keys(contextType!).map((k) => `${k}: undefined`).join(', ') + ' } as Context' : '{}'},
  states: {
${statesConfig}
  }
});

// Usage with React:
// import { useMachine } from '@xstate/react';
// const [state, send] = useMachine(${machineName}Machine);
`;
}
