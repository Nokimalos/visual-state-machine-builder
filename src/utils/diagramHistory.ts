import type { StateMachineModel } from '../model/types';

const STORAGE_KEY = 'vsmb-history';
const MAX_ENTRIES = 30;

export interface HistoryEntry {
  id: string;
  name: string;
  model: StateMachineModel;
  updatedAt: number;
}

function loadRaw(): HistoryEntry[] {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (!s) return [];
    const parsed = JSON.parse(s) as HistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRaw(entries: HistoryEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
}

export function getHistory(): HistoryEntry[] {
  return loadRaw().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function addToHistory(model: StateMachineModel): void {
  const entries = loadRaw();
  const name = model.name?.trim() || 'Untitled';
  const id = `h-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const newEntry: HistoryEntry = { id, name, model: JSON.parse(JSON.stringify(model)), updatedAt: Date.now() };
  const filtered = entries.filter((e) => e.name !== name || Math.abs(e.updatedAt - newEntry.updatedAt) > 1000);
  saveRaw([newEntry, ...filtered]);
}

export function removeFromHistory(id: string): void {
  saveRaw(loadRaw().filter((e) => e.id !== id));
}
