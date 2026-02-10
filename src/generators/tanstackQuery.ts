import type { StateMachineModel, OutputLanguage } from '../model/types';

/**
 * Generates a TanStack Query (React Query) hook that mirrors the state machine:
 * idle -> loading -> success | error, with refetch.
 */
export function generateTanStackQuery(model: StateMachineModel, language: OutputLanguage = 'ts'): string {
  const machineName = model.name.replace(/\s+/g, '') || 'StateMachine';
  const hookName = 'use' + machineName + 'Query';
  const isTs = language === 'ts';

  if (isTs) {
    return `// Generated State Machine: ${model.name}
// Format: TanStack Query (useQuery wrapper)

import { useQuery } from '@tanstack/react-query';

export function ${hookName}<TData = unknown, TError = Error>(
  queryKey: string[],
  queryFn: () => Promise<TData>
) {
  const query = useQuery<TData, TError>({ queryKey, queryFn });

  const status =
    query.isPending && query.data === undefined
      ? 'loading'
      : query.status === 'success'
        ? 'success'
        : query.status === 'error'
          ? 'error'
          : 'idle';

  return {
    status: status as 'idle' | 'loading' | 'success' | 'error',
    data: query.data,
    error: query.error ?? null,
    refetch: () => query.refetch(),
    isPending: query.isPending,
    isError: query.isError,
  };
}

// Usage:
// const { status, data, error, refetch } = ${hookName}(['key'], fetchData);
`;
  }

  return `// Generated State Machine: ${model.name}
// Format: TanStack Query (JavaScript)

import { useQuery } from '@tanstack/react-query';

export function ${hookName}(queryKey, queryFn) {
  const query = useQuery({ queryKey, queryFn });

  const status =
    query.isPending && query.data === undefined
      ? 'loading'
      : query.status === 'success'
        ? 'success'
        : query.status === 'error'
          ? 'error'
          : 'idle';

  return {
    status,
    data: query.data,
    error: query.error ?? null,
    refetch: () => query.refetch(),
    isPending: query.isPending,
    isError: query.isError,
  };
}

// Usage:
// const { status, data, error, refetch } = ${hookName}(['key'], fetchData);
`;
}
