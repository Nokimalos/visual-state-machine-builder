import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'vsmb-onboarding-done';

export function useOnboarding() {
  const [shouldRun, setShouldRun] = useState(false);

  useEffect(() => {
    try {
      const done = localStorage.getItem(STORAGE_KEY) === 'true';
      setShouldRun(!done);
    } catch {
      setShouldRun(true);
    }
  }, []);

  const finish = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {}
    setShouldRun(false);
  }, []);

  const run = useCallback(() => {
    setShouldRun(true);
  }, []);

  return { shouldRun, run, finish };
}
