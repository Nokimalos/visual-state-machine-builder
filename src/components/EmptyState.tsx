import type { Template } from './TemplateGallery';
import type { StateMachineModel } from '../model/types';

export interface EmptyStateProps {
  onSelectTemplate: (model: StateMachineModel) => void;
  featuredTemplates: Array<Pick<Template, 'name' | 'description' | 'model'>>;
  onStartFromScratch?: () => void;
}

export function EmptyState({ onSelectTemplate, featuredTemplates, onStartFromScratch }: EmptyStateProps) {
  return (
    <div className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="max-w-md">
        <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
          <svg
            className="h-12 w-12 text-[hsl(var(--muted-foreground))]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">
          Get started by choosing a template
        </h2>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Or add states and transitions on the canvas to build from scratch.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {featuredTemplates.slice(0, 3).map((t) => (
          <button
            key={t.name}
            type="button"
            className="flex flex-col items-start rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3 text-left transition hover:border-[hsl(var(--accent))]/50 hover:bg-[hsl(var(--accent))]/5 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/30 min-w-[180px]"
            onClick={() => onSelectTemplate(JSON.parse(JSON.stringify(t.model)))}
          >
            <span className="font-medium text-[hsl(var(--foreground))]">{t.name}</span>
            <span className="mt-0.5 line-clamp-2 text-xs text-[hsl(var(--muted-foreground))]">
              {t.description}
            </span>
          </button>
        ))}
      </div>
      {onStartFromScratch && (
        <button
          type="button"
          className="rounded-lg border border-[hsl(var(--border))] bg-transparent px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/30"
          onClick={onStartFromScratch}
        >
          Start from scratch
        </button>
      )}
    </div>
  );
}
