export type StateNodeType =
  | 'idle'
  | 'loading'
  | 'success'
  | 'error'
  | 'empty'
  | 'custom';

export interface StateNode {
  id: string;
  label: string;
  type?: StateNodeType;
  contextSchema?: Record<string, string>;
  /** Canvas position; persisted in model so layout is saved */
  position?: { x: number; y: number };
}

export interface Transition {
  id: string;
  fromStateId: string;
  toStateId: string;
  event: string;
}

export type OutputFormat = 'useReducer' | 'XState' | 'Zustand';

export interface StateMachineModel {
  name: string;
  initialStateId: string;
  states: StateNode[];
  transitions: Transition[];
  outputFormat: OutputFormat;
}

export interface ValidationError {
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}
