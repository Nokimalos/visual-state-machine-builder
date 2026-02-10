import { useReducer, useCallback } from 'react';
import type { StateMachineModel, StateNode, Transition } from '../model/types';
import {
  editorReducer,
  createInitialEditorState,
  type EditorAction,
} from '../store/editorStore';

export function useMachineModel(initialModel?: StateMachineModel) {
  const [state, dispatch] = useReducer(
    editorReducer,
    initialModel,
    createInitialEditorState
  );

  const setModel = useCallback((model: StateMachineModel) => {
    dispatch({ type: 'LOAD_MODEL', payload: model });
  }, []);

  const setName = useCallback((name: string) => {
    dispatch({ type: 'SET_NAME', payload: name });
  }, []);

  const setOutputFormat = useCallback((format: StateMachineModel['outputFormat']) => {
    dispatch({ type: 'SET_OUTPUT_FORMAT', payload: format });
  }, []);

  const setOutputLanguage = useCallback((language: StateMachineModel['outputLanguage']) => {
    if (language) dispatch({ type: 'SET_OUTPUT_LANGUAGE', payload: language });
  }, []);

  const setInitialState = useCallback((stateId: string) => {
    dispatch({ type: 'SET_INITIAL_STATE', payload: stateId });
  }, []);

  const addState = useCallback((payload?: Partial<StateNode>) => {
    dispatch({ type: 'ADD_STATE', payload });
  }, []);

  const updateState = useCallback((id: string, payload: Partial<StateNode>) => {
    dispatch({ type: 'UPDATE_STATE', id, payload });
  }, []);

  const removeState = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_STATE', id });
  }, []);

  const addTransition = useCallback(
    (fromStateId: string, toStateId: string, event: string) => {
      dispatch({ type: 'ADD_TRANSITION', fromStateId, toStateId, event });
    },
    []
  );

  const updateTransition = useCallback(
    (id: string, payload: Partial<Transition>) => {
      dispatch({ type: 'UPDATE_TRANSITION', id, payload });
    },
    []
  );

  const removeTransition = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_TRANSITION', id });
  }, []);

  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  const applyLayout = useCallback(
    (positions: Record<string, { x: number; y: number }>) => {
      dispatch({ type: 'APPLY_LAYOUT', payload: positions });
    },
    []
  );

  const applyDuplicate = useCallback(
    (states: StateNode[], transitions: Transition[]) => {
      dispatch({ type: 'APPLY_DUPLICATE', payload: { states, transitions } });
    },
    []
  );

  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.history.length - 1;

  return {
    model: state.model,
    setModel,
    setName,
    setOutputFormat,
    setOutputLanguage,
    setInitialState,
    addState,
    updateState,
    removeState,
    addTransition,
    updateTransition,
    removeTransition,
    undo,
    redo,
    reset,
    applyLayout,
    applyDuplicate,
    canUndo,
    canRedo,
    dispatch: dispatch as React.Dispatch<EditorAction>,
  };
}
