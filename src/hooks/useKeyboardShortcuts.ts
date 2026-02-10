import { useEffect } from 'react';

function isEditableElement(el: EventTarget | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName.toLowerCase();
  const role = el.getAttribute('role');
  const isInput = tag === 'input' || tag === 'textarea' || tag === 'select';
  const isContentEditable = el.isContentEditable;
  const isCombobox = role === 'combobox' || role === 'textbox';
  return isInput || isContentEditable || isCombobox;
}

export interface KeyboardShortcutsCallbacks {
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onAddState: () => void;
  onAddTransitionHint?: () => void;
  onSelectAll?: () => void;
  onDuplicate?: () => void;
}

export function useKeyboardShortcuts({
  onSave,
  onUndo,
  onRedo,
  onAddState,
  onAddTransitionHint,
  onSelectAll,
  onDuplicate,
}: KeyboardShortcutsCallbacks): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key === 's') {
        e.preventDefault();
        onSave();
        return;
      }
      if (ctrl && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          onRedo();
        } else {
          onUndo();
        }
        return;
      }
      if (ctrl && e.key === 'y') {
        e.preventDefault();
        onRedo();
        return;
      }
      if (ctrl && e.key === 'a') {
        e.preventDefault();
        onSelectAll?.();
        return;
      }
      if (ctrl && e.key === 'd') {
        e.preventDefault();
        onDuplicate?.();
        return;
      }

      if (!isEditableElement(e.target as HTMLElement)) {
        if (e.key === 'a' && !ctrl) {
          e.preventDefault();
          onAddState();
          return;
        }
        if (e.key === 't' && !ctrl) {
          e.preventDefault();
          onAddTransitionHint?.();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSave, onUndo, onRedo, onAddState, onAddTransitionHint, onSelectAll, onDuplicate]);
}

export const SHORTCUTS_LIST = [
  { keys: 'Ctrl+S', description: 'Save diagram' },
  { keys: 'Ctrl+Z', description: 'Undo' },
  { keys: 'Ctrl+Y', description: 'Redo' },
  { keys: 'Ctrl+A', description: 'Select all' },
  { keys: 'Ctrl+D', description: 'Duplicate selection' },
  { keys: 'A', description: 'Add state' },
  { keys: 'T', description: 'Add transition (hint)' },
  { keys: 'Delete / Backspace', description: 'Delete selection (on canvas)' },
] as const;
