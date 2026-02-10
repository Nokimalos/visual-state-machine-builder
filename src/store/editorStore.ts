import type {
  StateMachineModel,
  StateNode,
  Transition,
  OutputFormat,
  OutputLanguage,
} from '../model/types';
import { v4 as uuidv4 } from 'uuid';

const defaultModel: StateMachineModel = {
  name: 'MyStateMachine',
  initialStateId: '',
  states: [],
  transitions: [],
  outputFormat: 'useReducer',
};

export interface EditorState {
  model: StateMachineModel;
  history: StateMachineModel[];
  historyIndex: number;
}

export type EditorAction =
  | { type: 'SET_MODEL'; payload: StateMachineModel }
  | { type: 'SET_NAME'; payload: string }
  | { type: 'SET_OUTPUT_FORMAT'; payload: OutputFormat }
  | { type: 'SET_OUTPUT_LANGUAGE'; payload: OutputLanguage }
  | { type: 'SET_INITIAL_STATE'; payload: string }
  | { type: 'ADD_STATE'; payload?: Partial<StateNode> }
  | { type: 'UPDATE_STATE'; id: string; payload: Partial<StateNode> }
  | { type: 'REMOVE_STATE'; id: string }
  | { type: 'ADD_TRANSITION'; fromStateId: string; toStateId: string; event: string }
  | { type: 'UPDATE_TRANSITION'; id: string; payload: Partial<Transition> }
  | { type: 'REMOVE_TRANSITION'; id: string }
  | { type: 'LOAD_MODEL'; payload: StateMachineModel }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RESET' }
  | { type: 'APPLY_LAYOUT'; payload: Record<string, { x: number; y: number }> }
  | { type: 'APPLY_DUPLICATE'; payload: { states: StateNode[]; transitions: Transition[] } };

const MAX_HISTORY = 50;

function pushHistory(history: StateMachineModel[], model: StateMachineModel): StateMachineModel[] {
  const next = [...history.slice(0, history.length), JSON.parse(JSON.stringify(model))];
  return next.slice(-MAX_HISTORY);
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  const { model, history, historyIndex } = state;

  switch (action.type) {
    case 'SET_MODEL':
      return {
        ...state,
        model: action.payload,
        history: pushHistory(history.slice(0, historyIndex + 1), action.payload),
        historyIndex: Math.min(historyIndex + 1, MAX_HISTORY - 1),
      };
    case 'SET_NAME':
      return {
        ...state,
        model: { ...model, name: action.payload },
      };
    case 'SET_OUTPUT_FORMAT':
      return {
        ...state,
        model: { ...model, outputFormat: action.payload },
      };
    case 'SET_OUTPUT_LANGUAGE':
      return {
        ...state,
        model: { ...model, outputLanguage: action.payload },
      };
    case 'SET_INITIAL_STATE':
      return {
        ...state,
        model: { ...model, initialStateId: action.payload },
      };
    case 'ADD_STATE': {
      const id = action.payload?.id ?? uuidv4();
      const label = action.payload?.label ?? 'new_state';
      const newNode: StateNode = {
        id,
        label,
        type: action.payload?.type ?? 'custom',
        contextSchema: action.payload?.contextSchema,
        position: action.payload?.position,
      };
      const newStates = [...model.states, newNode];
      const newInitial =
        model.states.length === 0 ? id : model.initialStateId;
      const newModel: StateMachineModel = {
        ...model,
        states: newStates,
        initialStateId: newInitial,
      };
      return {
        ...state,
        model: newModel,
        history: pushHistory(history.slice(0, historyIndex + 1), newModel),
        historyIndex: Math.min(historyIndex + 1, MAX_HISTORY - 1),
      };
    }
    case 'UPDATE_STATE': {
      const newStates = model.states.map((s) =>
        s.id === action.id ? { ...s, ...action.payload } : s
      );
      const newModel = { ...model, states: newStates };
      return {
        ...state,
        model: newModel,
      };
    }
    case 'REMOVE_STATE': {
      const newStates = model.states.filter((s) => s.id !== action.id);
      const newTransitions = model.transitions.filter(
        (t) => t.fromStateId !== action.id && t.toStateId !== action.id
      );
      const newInitial =
        model.initialStateId === action.id
          ? newStates[0]?.id ?? ''
          : model.initialStateId;
      const newModel: StateMachineModel = {
        ...model,
        states: newStates,
        transitions: newTransitions,
        initialStateId: newInitial,
      };
      return {
        ...state,
        model: newModel,
        history: pushHistory(history.slice(0, historyIndex + 1), newModel),
        historyIndex: Math.min(historyIndex + 1, MAX_HISTORY - 1),
      };
    }
    case 'ADD_TRANSITION': {
      const id = uuidv4();
      const newTransition: Transition = {
        id,
        fromStateId: action.fromStateId,
        toStateId: action.toStateId,
        event: action.event,
      };
      const newModel: StateMachineModel = {
        ...model,
        transitions: [...model.transitions, newTransition],
      };
      return {
        ...state,
        model: newModel,
        history: pushHistory(history.slice(0, historyIndex + 1), newModel),
        historyIndex: Math.min(historyIndex + 1, MAX_HISTORY - 1),
      };
    }
    case 'UPDATE_TRANSITION': {
      const newTransitions = model.transitions.map((t) =>
        t.id === action.id ? { ...t, ...action.payload } : t
      );
      return { ...state, model: { ...model, transitions: newTransitions } };
    }
    case 'REMOVE_TRANSITION': {
      const newTransitions = model.transitions.filter((t) => t.id !== action.id);
      return {
        ...state,
        model: { ...model, transitions: newTransitions },
      };
    }
    case 'LOAD_MODEL':
      return {
        ...state,
        model: action.payload,
        history: pushHistory([], action.payload),
        historyIndex: 0,
      };
    case 'UNDO':
      if (historyIndex <= 0) return state;
      return {
        ...state,
        model: JSON.parse(JSON.stringify(history[historyIndex - 1])),
        historyIndex: historyIndex - 1,
      };
    case 'REDO':
      if (historyIndex >= history.length - 1) return state;
      return {
        ...state,
        model: JSON.parse(JSON.stringify(history[historyIndex + 1])),
        historyIndex: historyIndex + 1,
      };
    case 'RESET': {
      const empty = { ...defaultModel };
      return {
        model: empty,
        history: [JSON.parse(JSON.stringify(empty))],
        historyIndex: 0,
      };
    }
    case 'APPLY_LAYOUT': {
      const positions = action.payload;
      const newStates = model.states.map((s) =>
        positions[s.id] != null ? { ...s, position: positions[s.id] } : s
      );
      const newModel = { ...model, states: newStates };
      return {
        ...state,
        model: newModel,
        history: pushHistory(history.slice(0, historyIndex + 1), newModel),
        historyIndex: Math.min(historyIndex + 1, MAX_HISTORY - 1),
      };
    }
    case 'APPLY_DUPLICATE': {
      const { states: newStates, transitions: newTransitions } = action.payload;
      const nextStates = [...model.states, ...newStates];
      const nextTransitions = [...model.transitions, ...newTransitions];
      const newModel = { ...model, states: nextStates, transitions: nextTransitions };
      return {
        ...state,
        model: newModel,
        history: pushHistory(history.slice(0, historyIndex + 1), newModel),
        historyIndex: Math.min(historyIndex + 1, MAX_HISTORY - 1),
      };
    }
    default:
      return state;
  }
}

export function createInitialEditorState(model?: StateMachineModel): EditorState {
  const m = model ?? defaultModel;
  return {
    model: m,
    history: [JSON.parse(JSON.stringify(m))],
    historyIndex: 0,
  };
}
