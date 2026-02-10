import type { StateMachineModel } from '../model/types';

/**
 * Converts a StateMachineModel to Mermaid stateDiagram-v2 syntax.
 */
export function exportToMermaid(model: StateMachineModel): string {
  const lines: string[] = ['stateDiagram-v2', '    direction LR'];
  const stateIds = new Set(model.states.map((s) => s.id));
  const byId = new Map(model.states.map((s) => [s.id, s]));

  const quote = (str: string) => {
    const escaped = str.replace(/"/g, '\\"');
    return str.includes(' ') || /[[\]:]/.test(str) ? `["${escaped}"]` : str;
  };

  for (const s of model.states) {
    const isInitial = s.id === model.initialStateId;
    if (isInitial) {
      lines.push(`    [*] --> ${quote(s.label)}`);
    }
  }

  for (const t of model.transitions) {
    if (!stateIds.has(t.fromStateId) || !stateIds.has(t.toStateId)) continue;
    const from = quote(byId.get(t.fromStateId)!.label);
    const to = quote(byId.get(t.toStateId)!.label);
    const event = t.event.replace(/[[\]:]/g, '_');
    lines.push(`    ${from} --> ${to} : ${event}`);
  }

  return lines.join('\n');
}
