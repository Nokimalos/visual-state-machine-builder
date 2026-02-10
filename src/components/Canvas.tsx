import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type Edge,
  type NodeTypes,
  type NodeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { StateNode as StateNodeComponent } from './StateNode';
import { EventNameModal } from './EventNameModal';
import type { StateMachineModel, StateNode, Transition } from '../model/types';

const nodeTypes: NodeTypes = { state: StateNodeComponent };

function defaultPosition(i: number) {
  return { x: 100 + (i % 3) * 220, y: 80 + Math.floor(i / 3) * 140 };
}

function modelToNodesAndEdges(model: StateMachineModel): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = model.states.map((s, i) => ({
    id: s.id,
    type: 'state',
    position: s.position ?? defaultPosition(i),
    data: {
      ...s,
      isInitial: s.id === model.initialStateId,
    },
  }));

  const edges: Edge[] = model.transitions.map((t) => ({
    id: t.id,
    source: t.fromStateId,
    target: t.toStateId,
    label: t.event,
    labelBgPadding: [8, 5] as [number, number],
    labelBgBorderRadius: 6,
    labelBgStyle: { fill: 'hsl(var(--card))', stroke: 'hsl(var(--border))' },
    labelStyle: { fill: 'hsl(var(--foreground))', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' },
  }));

  return { nodes, edges };
}

export interface CanvasApi {
  selectAll: () => void;
  duplicate: () => void;
}

export interface CanvasProps {
  model: StateMachineModel;
  onAddTransition: (fromStateId: string, toStateId: string, event: string) => void;
  onUpdateTransitionEvent: (transitionId: string, event: string) => void;
  onRemoveTransition: (id: string) => void;
  onRemoveState: (id: string) => void;
  onStatePositionChange?: (stateId: string, position: { x: number; y: number }) => void;
  canvasApiRef?: React.RefObject<CanvasApi | null>;
  onDuplicate?: (states: StateNode[], transitions: Transition[]) => void;
}

export const Canvas = forwardRef<HTMLDivElement, CanvasProps>(function Canvas({
  model,
  onAddTransition,
  onUpdateTransitionEvent: _onUpdateTransitionEvent,
  onRemoveTransition,
  onRemoveState,
  onStatePositionChange,
  canvasApiRef,
  onDuplicate,
}, ref) {
  const { nodes: initialNodes, edges: initialEdges } = modelToNodesAndEdges(model);
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [pendingConnection, setPendingConnection] = useState<{
    source: string;
    target: string;
  } | null>(null);

  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;
    setPendingConnection({ source: connection.source, target: connection.target });
  }, []);

  const handleEventConfirm = useCallback(
    (eventName: string) => {
      if (pendingConnection) {
        onAddTransition(pendingConnection.source, pendingConnection.target, eventName);
        setPendingConnection(null);
      }
    },
    [pendingConnection, onAddTransition]
  );

  const handleEventCancel = useCallback(() => {
    setPendingConnection(null);
  }, []);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChangeInternal(changes);
      for (const change of changes) {
        if (change.type === 'position' && change.dragging === false && change.position) {
          const id = 'id' in change ? change.id : undefined;
          if (id) onStatePositionChange?.(id, change.position);
        }
      }
    },
    [onNodesChangeInternal, onStatePositionChange]
  );

  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      deleted.forEach((n) => onRemoveState(n.id));
    },
    [onRemoveState]
  );

  const onEdgesDelete = useCallback(
    (deleted: Edge[]) => {
      deleted.forEach((e) => onRemoveTransition(e.id));
    },
    [onRemoveTransition]
  );

  useEffect(() => {
    const { nodes: n, edges: e } = modelToNodesAndEdges(model);
    setNodes(n);
    setEdges(e);
  }, [model]);

  const selectAll = useCallback(() => {
    setNodes((n) => n.map((node) => ({ ...node, selected: true })));
    setEdges((e) => e.map((edge) => ({ ...edge, selected: true })));
  }, []);

  const duplicate = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected);
    if (selectedNodes.length === 0 || !onDuplicate) return;
    const oldToNew = new Map<string, string>();
    selectedNodes.forEach((n) => oldToNew.set(n.id, uuidv4()));
    const OFFSET = 60;
    const newStates: StateNode[] = selectedNodes.map((n) => {
      const state = model.states.find((s) => s.id === n.id);
      const pos = n.position ?? { x: 0, y: 0 };
      return {
        id: oldToNew.get(n.id)!,
        label: state?.label ?? n.data?.label ?? 'state',
        type: state?.type ?? 'custom',
        contextSchema: state?.contextSchema,
        position: { x: pos.x + OFFSET, y: pos.y + OFFSET },
      };
    });
    const selectedIds = new Set(selectedNodes.map((n) => n.id));
    const newTransitions: Transition[] = edges
      .filter((e) => selectedIds.has(e.source) && selectedIds.has(e.target))
      .map((e) => {
        const t = model.transitions.find((tr) => tr.id === e.id);
        return {
          id: uuidv4(),
          fromStateId: oldToNew.get(e.source)!,
          toStateId: oldToNew.get(e.target)!,
          event: t?.event ?? 'EVENT',
        };
      });
    onDuplicate(newStates, newTransitions);
  }, [nodes, edges, model, onDuplicate]);

  useImperativeHandle(
    canvasApiRef,
    () => ({ selectAll, duplicate }),
    [selectAll, duplicate]
  );

  return (
    <div ref={ref} className="h-full w-full">
      <EventNameModal
        isOpen={pendingConnection !== null}
        onConfirm={handleEventConfirm}
        onCancel={handleEventCancel}
      />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        nodeTypes={nodeTypes}
        fitView
        className="canvas"
        deleteKeyCode={['Backspace', 'Delete']}
      >
        <Background gap={16} size={1} />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
});
