import type { StateMachineModel } from '../model/types';
import { validateModel } from '../model/validation';

const VSMB_VERSION = 1;

export interface VsbmPayload {
  version: number;
  format: 'vsmb';
  model: StateMachineModel;
}

/**
 * Encode a state machine model for URL or storage.
 * Uses JSON + base64 with a versioned payload for future compatibility.
 */
export function encodeState(model: StateMachineModel): string {
  const payload: VsbmPayload = {
    version: VSMB_VERSION,
    format: 'vsmb',
    model,
  };
  const json = JSON.stringify(payload);
  return btoa(unescape(encodeURIComponent(json)));
}

/**
 * Decode a state machine from a base64 string (e.g. from ?state= in URL).
 * Returns null if payload is invalid or missing states/transitions.
 * Does not require full validation so shared links with fixable issues still load.
 */
export function decodeState(encoded: string): StateMachineModel | null {
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    const payload = JSON.parse(json) as VsbmPayload;
    if (payload.format !== 'vsmb' || !payload.model) return null;
    const model = payload.model as StateMachineModel;
    if (!Array.isArray(model.states) || !Array.isArray(model.transitions)) return null;
    return model;
  } catch {
    return null;
  }
}

/**
 * Check if a parsed file/object is a valid VSMB or legacy diagram.
 * Returns the model if valid, null otherwise.
 */
export function parseVsbmFile(obj: unknown): StateMachineModel | null {
  if (obj == null || typeof obj !== 'object') return null;
  const o = obj as Record<string, unknown>;
  // New format: { version, format, model }
  if (o.format === 'vsmb' && o.model && typeof o.model === 'object') {
    const model = o.model as StateMachineModel;
    if (Array.isArray(model.states) && Array.isArray(model.transitions)) {
      const validation = validateModel(model);
      return validation.valid ? model : null;
    }
  }
  // Legacy: plain StateMachineModel
  if (Array.isArray(o.states) && Array.isArray(o.transitions)) {
    const model = o as unknown as StateMachineModel;
    const validation = validateModel(model);
    return validation.valid ? model : null;
  }
  return null;
}
