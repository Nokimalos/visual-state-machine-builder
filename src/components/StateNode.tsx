import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { StateNode as StateNodeType } from '../model/types';

const typeIcons: Record<string, string> = {
  idle: '○',
  loading: '⟳',
  success: '✓',
  error: '✕',
  empty: '∅',
  custom: '●',
};

export interface StateNodeData extends StateNodeType {
  isInitial?: boolean;
}

function StateNodeComponent({ data, selected }: NodeProps<StateNodeData>) {
  const icon = typeIcons[data.type ?? 'custom'] ?? '●';
  return (
    <div
      className={`
        min-w-[100px] rounded-xl border-2 bg-[hsl(var(--card))] px-4 py-3 text-center shadow-sm
        ${selected ? 'border-[hsl(var(--accent))] ring-2 ring-[hsl(var(--accent))]/30' : 'border-[hsl(var(--border))]'}
        ${data.isInitial ? 'border-[hsl(var(--success))]/60' : ''}
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2.5 !w-2.5 !border-2 !border-[hsl(var(--border))] !bg-[hsl(var(--card))]"
      />
      <div className="text-lg text-[hsl(var(--muted-foreground))]" aria-hidden>
        {icon}
      </div>
      <div className="mt-0.5 font-medium text-[hsl(var(--foreground))]">{data.label}</div>
      {data.isInitial && (
        <span className="mt-1 block text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--success))]">
          initial
        </span>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2.5 !w-2.5 !border-2 !border-[hsl(var(--border))] !bg-[hsl(var(--card))]"
      />
    </div>
  );
}

export const StateNode = memo(StateNodeComponent);
