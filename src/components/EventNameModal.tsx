import { useState, useEffect, useRef } from 'react';

export interface EventNameModalProps {
  isOpen: boolean;
  onConfirm: (eventName: string) => void;
  onCancel: () => void;
}

const DEFAULT_EVENT = 'EVENT';

export function EventNameModal({ isOpen, onConfirm, onCancel }: EventNameModalProps) {
  const [value, setValue] = useState(DEFAULT_EVENT);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(DEFAULT_EVENT);
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) onConfirm(trimmed);
    else onCancel();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-name-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
        onKeyDown={(e) => e.key === 'Escape' && onCancel()}
        aria-hidden
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-xl">
        <h2
          id="event-name-modal-title"
          className="text-lg font-semibold text-[hsl(var(--foreground))]"
        >
          Event name
        </h2>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          e.g. FETCH_SUCCESS, RETRY, SUBMIT
        </p>
        <form onSubmit={handleSubmit} className="mt-4">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && onCancel()}
            className="mt-2 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2.5 font-mono text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--ring))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/20"
            placeholder="EVENT_NAME"
            aria-label="Event name"
          />
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-[hsl(var(--border))] bg-transparent px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/30"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[hsl(var(--accent))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2 focus:ring-offset-[hsl(var(--card))] disabled:opacity-50"
              disabled={!value.trim()}
            >
              OK
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
