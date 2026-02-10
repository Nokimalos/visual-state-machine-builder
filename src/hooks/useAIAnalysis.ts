import { useState, useCallback, useEffect } from 'react';
import type { StateMachineModel } from '../model/types';
import { aiService, type AnalysisIssue, type Suggestion } from '../services/aiService';

export interface UseAIAnalysisResult {
  loading: boolean;
  error: string | null;
  analyzeResult: AnalysisIssue[] | null;
  suggestResult: Suggestion[] | null;
  testsResult: string | null;
  explainResult: string | null;
  runAnalyze: () => Promise<void>;
  runSuggest: () => Promise<void>;
  runGenerateTests: () => Promise<void>;
  runExplain: () => Promise<void>;
}

export function useAIAnalysis(model: StateMachineModel): UseAIAnalysisResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzeResult, setAnalyzeResult] = useState<AnalysisIssue[] | null>(null);
  const [suggestResult, setSuggestResult] = useState<Suggestion[] | null>(null);
  const [testsResult, setTestsResult] = useState<string | null>(null);
  const [explainResult, setExplainResult] = useState<string | null>(null);

  const runAnalyze = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const issues = await aiService.analyze(model);
      setAnalyzeResult(issues);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }, [model]);

  const runSuggest = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const suggestions = await aiService.suggest(model);
      setSuggestResult(suggestions);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Suggest failed');
    } finally {
      setLoading(false);
    }
  }, [model]);

  const runGenerateTests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const code = await aiService.generateTests(model);
      setTestsResult(code);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generate tests failed');
    } finally {
      setLoading(false);
    }
  }, [model]);

  const runExplain = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const text = await aiService.explain(model);
      setExplainResult(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Explain failed');
    } finally {
      setLoading(false);
    }
  }, [model]);

  useEffect(() => {
    setAnalyzeResult(null);
    setSuggestResult(null);
    setTestsResult(null);
    setExplainResult(null);
  }, [model]);

  return {
    loading,
    error,
    analyzeResult,
    suggestResult,
    testsResult,
    explainResult,
    runAnalyze,
    runSuggest,
    runGenerateTests,
    runExplain,
  };
}
