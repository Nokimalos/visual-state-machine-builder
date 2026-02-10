import type { StateMachineModel } from '../model/types';

const STORAGE_KEY = 'vsmb-user-templates';

export interface UserTemplate {
  id: string;
  name: string;
  model: StateMachineModel;
  createdAt: number;
}

function loadRaw(): UserTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRaw(list: UserTemplate[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function getUserTemplates(): UserTemplate[] {
  return loadRaw();
}

export function saveUserTemplate(name: string, model: StateMachineModel): UserTemplate {
  const list = loadRaw();
  const id = `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const entry: UserTemplate = { id, name, model: JSON.parse(JSON.stringify(model)), createdAt: Date.now() };
  list.push(entry);
  saveRaw(list);
  return entry;
}

export function removeUserTemplate(id: string): void {
  const list = loadRaw().filter((t) => t.id !== id);
  saveRaw(list);
}
