import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { v4 as uuidv4 } from 'uuid';
import type { StateMachineModel, StateNode, Transition } from '../model/types';
import { getLayoutPositions } from '../utils/layout';

/**
 * Parse React component code and infer a state machine model.
 * Detects useState with literal/union initial values and useReducer (initial state + action types).
 */
export function parseReactComponent(code: string): StateMachineModel | null {
  let ast: ReturnType<typeof parse>;
  try {
    ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });
  } catch {
    return null;
  }

  const stateCandidates = new Set<string>();
  const transitions: Array<{ from: string; to: string; event: string }> = [];
  let initialStateCandidate: string | null = null;

  traverse(ast, {
    CallExpression(path) {
      const callee = path.node.callee;
      if (callee.type !== 'Identifier') return;
      const name = callee.name;

      if (name === 'useState') {
        const arg = path.node.arguments[0];
        if (arg?.type === 'StringLiteral') {
          stateCandidates.add(arg.value);
          if (initialStateCandidate == null) initialStateCandidate = arg.value;
        }
        if (arg?.type === 'TSAsExpression' && arg.expression.type === 'StringLiteral') {
          stateCandidates.add(arg.expression.value);
          if (initialStateCandidate == null) initialStateCandidate = arg.expression.value;
        }
        return;
      }

      if (name === 'useReducer') {
        const args = path.node.arguments;
        const firstArg = args[0];
        if (firstArg?.type === 'Identifier') {
          // Initial state might be a variable; we'd need to resolve it. Skip for now.
        }
        const secondArg = args[1];
        if (secondArg?.type === 'ObjectExpression') {
          secondArg.properties.forEach((prop) => {
            if (prop.type === 'ObjectProperty' && prop.key.type === 'Identifier') {
              stateCandidates.add(prop.key.name);
            }
          });
        }
        return;
      }

      // setState('loading') or setStatus('loading') pattern
      if (name.startsWith('set') && path.node.arguments.length > 0) {
        const arg = path.node.arguments[0];
        if (arg?.type === 'StringLiteral') {
          stateCandidates.add(arg.value);
        }
      }

      // dispatch({ type: 'FETCH' }) pattern
      if (name === 'dispatch' && path.node.arguments[0]?.type === 'ObjectExpression') {
        const obj = path.node.arguments[0];
        const typeProp = obj.properties.find(
          (p) => p.type === 'ObjectProperty' && p.key.type === 'Identifier' && p.key.name === 'type'
        );
        if (typeProp?.type === 'ObjectProperty' && typeProp.value.type === 'StringLiteral') {
          transitions.push({
            from: 'unknown',
            to: 'unknown',
            event: typeProp.value.value,
          });
        }
      }
    },
  });

  // Also scan for string literals in conditionals: status === 'idle', state === 'loading'
  traverse(ast, {
    BinaryExpression(path) {
      if (path.node.operator !== '===' && path.node.operator !== '==') return;
      const left = path.node.left;
      const right = path.node.right;
      if (right.type === 'StringLiteral') {
        stateCandidates.add(right.value);
      }
      if (left.type === 'StringLiteral') {
        stateCandidates.add(left.value);
      }
    },
  });

  if (stateCandidates.size === 0) return null;

  const stateList = Array.from(stateCandidates);
  const stateIds = stateList.map(() => uuidv4());
  const idByLabel = Object.fromEntries(stateList.map((l, i) => [l, stateIds[i]]));
  const initialId = initialStateCandidate && idByLabel[initialStateCandidate] ? idByLabel[initialStateCandidate] : stateIds[0];

  const states: StateNode[] = stateList.map((label, i) => ({
    id: stateIds[i],
    label,
    type: inferStateType(label),
  }));

  const transitionList: Transition[] = [];
  const eventNames = [...new Set(transitions.map((t) => t.event))].filter((e) => e !== 'unknown');
  if (eventNames.length > 0) {
    eventNames.forEach((event) => {
      for (let i = 0; i < stateList.length - 1; i++) {
        transitionList.push({
          id: uuidv4(),
          fromStateId: stateIds[i],
          toStateId: stateIds[i + 1],
          event,
        });
      }
    });
  } else {
    for (let i = 0; i < stateList.length - 1; i++) {
      transitionList.push({
        id: uuidv4(),
        fromStateId: stateIds[i],
        toStateId: stateIds[i + 1],
        event: 'NEXT',
      });
    }
  }

  const model: StateMachineModel = {
    name: 'ImportedStateMachine',
    initialStateId: initialId,
    states,
    transitions: transitionList.length > 0 ? transitionList : [],
    outputFormat: 'useReducer',
  };

  const positions = getLayoutPositions(model);
  model.states = model.states.map((s) => ({ ...s, position: positions[s.id] }));

  return model;
}

function inferStateType(label: string): StateNode['type'] {
  const l = label.toLowerCase();
  if (l === 'idle') return 'idle';
  if (l === 'loading' || l === 'pending' || l === 'submitting') return 'loading';
  if (l === 'success') return 'success';
  if (l === 'error') return 'error';
  if (l === 'empty') return 'empty';
  return 'custom';
}
