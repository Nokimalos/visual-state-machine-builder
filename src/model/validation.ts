import type { StateMachineModel, ValidationError, ValidationResult } from './types';

const EVENT_IDENTIFIER_REGEX = /^[A-Za-z_][A-Za-z0-9_]*$/;

function validIdentifier(str: string): boolean {
  return EVENT_IDENTIFIER_REGEX.test(str) && str.length > 0;
}

export function validateModel(model: StateMachineModel): ValidationResult {
  const errors: ValidationError[] = [];

  if (!model.name?.trim()) {
    errors.push({ path: 'name', message: 'Machine name is required' });
  }

  const stateIds = new Set(model.states.map((s) => s.id));
  if (model.states.length === 0) {
    errors.push({ path: 'states', message: 'At least one state is required' });
  }

  if (!model.initialStateId) {
    errors.push({ path: 'initialStateId', message: 'Initial state must be set' });
  } else if (!stateIds.has(model.initialStateId)) {
    errors.push({
      path: 'initialStateId',
      message: 'Initial state must reference an existing state',
    });
  }

  for (const t of model.transitions) {
    if (!stateIds.has(t.fromStateId)) {
      errors.push({
        path: `transitions.${t.id}`,
        message: `Transition from unknown state: ${t.fromStateId}`,
      });
    }
    if (!stateIds.has(t.toStateId)) {
      errors.push({
        path: `transitions.${t.id}`,
        message: `Transition to unknown state: ${t.toStateId}`,
      });
    }
    if (!validIdentifier(t.event)) {
      errors.push({
        path: `transitions.${t.id}`,
        message: `Invalid event name: "${t.event}". Use a valid identifier (e.g. FETCH_SUCCESS, RETRY).`,
      });
    }
  }

  const fromEventPairs = new Set<string>();
  for (const t of model.transitions) {
    const key = `${t.fromStateId}:${t.event}`;
    if (fromEventPairs.has(key)) {
      errors.push({
        path: `transitions.${t.id}`,
        message: `Duplicate transition: from "${t.fromStateId}" on event "${t.event}". Machine should be deterministic.`,
      });
    }
    fromEventPairs.add(key);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
