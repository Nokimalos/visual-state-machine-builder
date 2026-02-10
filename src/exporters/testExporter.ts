import type { StateMachineModel, OutputLanguage } from '../model/types';

/**
 * Generates a Vitest test file for the state machine (useReducer-style).
 * Tests initial state and each transition.
 */
export function exportTests(model: StateMachineModel): string {
  const lang: OutputLanguage = model.outputLanguage ?? 'ts';
  const isTs = lang === 'ts';
  const machineName = model.name.replace(/\s+/g, '') || 'StateMachine';
  const reducerName = machineName.charAt(0).toLowerCase() + machineName.slice(1) + 'Reducer';
  const initial = model.states.find((s) => s.id === model.initialStateId);
  if (!initial) return '// No initial state';

  const transitionTests = model.transitions.map((t) => {
    const from = model.states.find((s) => s.id === t.fromStateId)!;
    const to = model.states.find((s) => s.id === t.toStateId)!;
    const payload = to.contextSchema && Object.keys(to.contextSchema).length > 0 ? ', {}' : '';
    return {
      from: from.label,
      to: to.label,
      event: t.event,
      action: `{ type: '${t.event}'${payload} }`,
    };
  });

  const tests = `
import { describe, it, expect } from 'vitest';
import { ${reducerName}, initial${machineName}State${isTs ? `, type ${machineName}State` : ''} } from './${machineName}';

describe('${machineName}', () => {
  it('has correct initial state', () => {
    expect(initial${machineName}State.status).toBe('${initial.label.replace(/'/g, "\\'")}');
  });

${transitionTests
  .map(
    (tt) => `  it('transitions from ${tt.from} to ${tt.to} on ${tt.event}', () => {
    const state = { status: '${tt.from}' }${isTs ? ` as ${machineName}State` : ''};
    const next = ${reducerName}(state, ${tt.action});
    expect(next.status).toBe('${tt.to}');
  });`
  )
  .join('\n\n')}
});
`.trim();

  return tests;
}
