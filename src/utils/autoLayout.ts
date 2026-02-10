import type { StateMachineModel } from '../model/types';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 88;

interface ElkNode {
  id: string;
  x?: number;
  y?: number;
  width: number;
  height: number;
  children?: ElkNode[];
}

interface ElkEdge {
  id: string;
  sources: string[];
  targets: string[];
}

interface ElkGraph {
  id: string;
  children: ElkNode[];
  edges: ElkEdge[];
  layoutOptions?: Record<string, string>;
}

/**
 * Uses ELK (Eclipse Layout Kernel) to compute positions for the state machine.
 * Returns a map stateId -> { x, y } with a hierarchical left-to-right layout.
 */
export async function getElkLayoutPositions(model: StateMachineModel): Promise<Record<string, { x: number; y: number }>> {
  const { states, transitions } = model;
  if (states.length === 0) return {};

  const children: ElkNode[] = states.map((s) => ({
    id: s.id,
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
  }));

  const edges: ElkEdge[] = transitions.map((t) => ({
    id: t.id,
    sources: [t.fromStateId],
    targets: [t.toStateId],
  }));

  const graph: ElkGraph = {
    id: 'root',
    children,
    edges,
    layoutOptions: {
      'elk.direction': 'RIGHT',
      'elk.algorithm': 'layered',
      'elk.spacing.nodeNode': '80',
      'elk.layered.spacing.nodeNodeBetweenLayers': '120',
    },
  };

  // Use bundled build to avoid web-worker dependency (not resolved by Vite in browser)
  const { default: ELK } = await import('elkjs/lib/elk.bundled.js');
  const elk = new ELK();
  const result = await elk.layout(graph);
  const resultMap: Record<string, { x: number; y: number }> = {};

  if (result.children) {
    for (const node of result.children) {
      resultMap[node.id] = {
        x: node.x ?? 0,
        y: node.y ?? 0,
      };
    }
  }

  return resultMap;
}
