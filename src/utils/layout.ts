import type { StateMachineModel } from '../model/types';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 88;
const HORIZONTAL_GAP = 140;
const VERTICAL_GAP = 120;

/**
 * Computes positions for all states so the diagram reads left-to-right:
 * initial state on the left, then levels by BFS, with minimal crossing.
 * Returns a map stateId -> { x, y }.
 */
export function getLayoutPositions(model: StateMachineModel): Record<string, { x: number; y: number }> {
  const { states, transitions, initialStateId } = model;
  if (states.length === 0) return {};

  const outEdges = new Map<string, Array<{ to: string }>>();
  for (const t of transitions) {
    if (!outEdges.has(t.fromStateId)) outEdges.set(t.fromStateId, []);
    outEdges.get(t.fromStateId)!.push({ to: t.toStateId });
  }

  // BFS from initial to assign level (distance from initial)
  const level = new Map<string, number>();
  const queue = initialStateId ? [initialStateId] : [states[0].id];
  level.set(queue[0], 0);
  let head = 0;
  while (head < queue.length) {
    const id = queue[head++];
    const dist = level.get(id) ?? 0;
    for (const { to } of outEdges.get(id) ?? []) {
      if (level.has(to)) continue;
      level.set(to, dist + 1);
      queue.push(to);
    }
  }
  let maxLevel = -1;
  for (const l of level.values()) if (l > maxLevel) maxLevel = l;
  for (const s of states) {
    if (!level.has(s.id)) level.set(s.id, maxLevel + 1);
  }

  // Group state ids by level
  const byLevel = new Map<number, string[]>();
  for (const s of states) {
    const l = level.get(s.id) ?? 0;
    if (!byLevel.has(l)) byLevel.set(l, []);
    byLevel.get(l)!.push(s.id);
  }

  const result: Record<string, { x: number; y: number }> = {};
  const levels = [...byLevel.keys()].sort((a, b) => a - b);
  for (let i = 0; i < levels.length; i++) {
    const ids = byLevel.get(levels[i])!;
    const x = 80 + i * (NODE_WIDTH + HORIZONTAL_GAP);
    const totalHeight = ids.length * NODE_HEIGHT + (ids.length - 1) * VERTICAL_GAP;
    let y = 60 - totalHeight / 2 + NODE_HEIGHT / 2;
    for (const id of ids) {
      result[id] = { x, y };
      y += NODE_HEIGHT + VERTICAL_GAP;
    }
  }
  return result;
}
