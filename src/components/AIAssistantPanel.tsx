import { useState } from 'react';
import { toast } from 'sonner';
import type { StateMachineModel } from '../model/types';
import { useAIAnalysis } from '../hooks/useAIAnalysis';

export interface AIAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  model: StateMachineModel;
  onOpenSettings: () => void;
}

const TABS = ['Analyze', 'Suggest', 'Generate Tests', 'Explain'] as const;

export function AIAssistantPanel({ isOpen, onClose, model, onOpenSettings }: AIAssistantPanelProps) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Analyze');
  const {
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
  } = useAIAnalysis(model);

  const handleRun = () => {
    if (model.states.length === 0) {
      toast.error('Add at least one state first');
      return;
    }
    if (activeTab === 'Analyze') runAnalyze();
    if (activeTab === 'Suggest') runSuggest();
    if (activeTab === 'Generate Tests') runGenerateTests();
    if (activeTab === 'Explain') runExplain();
  };

  const handleCopyTests = () => {
    if (testsResult) {
      navigator.clipboard.writeText(testsResult).then(() => toast.success('Tests copied to clipboard'));
    }
  };

  return (
    <>
      <div
        className={`fixed top-0 right-0 z-40 h-full w-full max-w-md border-l border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-xl transition-transform duration-200 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!isOpen}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-4 py-3">
            <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">AI Assistant</h2>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-lg border border-[hsl(var(--border))] bg-transparent px-2 py-1 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--border))] focus:outline-none"
                onClick={onOpenSettings}
              >
                Settings
              </button>
              <button
                type="button"
                className="rounded-lg border border-[hsl(var(--border))] bg-transparent px-2 py-1 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--border))] focus:outline-none"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
          <div className="flex border-b border-[hsl(var(--border))] px-2">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                className={`px-3 py-2 text-sm font-medium focus:outline-none ${
                  activeTab === tab
                    ? 'border-b-2 border-[hsl(var(--accent))] text-[hsl(var(--accent))]'
                    : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <button
              type="button"
              className="rounded-lg bg-[hsl(var(--accent))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 focus:outline-none disabled:opacity-50"
              onClick={handleRun}
              disabled={loading || model.states.length === 0}
            >
              {loading ? 'Running…' : `Run ${activeTab}`}
            </button>
            {error && (
              <p className="mt-3 text-sm text-[hsl(var(--destructive))]" role="alert">
                {error}
              </p>
            )}
            {activeTab === 'Analyze' && analyzeResult !== null && (
              <ul className="mt-3 space-y-2">
                {analyzeResult.length === 0 ? (
                  <li className="text-sm text-[hsl(var(--muted-foreground))]">No issues found.</li>
                ) : (
                  analyzeResult.map((issue, i) => (
                    <li
                      key={i}
                      className={`rounded-lg border px-3 py-2 text-sm ${
                        issue.type === 'error'
                          ? 'border-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10 text-[hsl(var(--destructive))]'
                          : 'border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {issue.message}
                    </li>
                  ))
                )}
              </ul>
            )}
            {activeTab === 'Suggest' && suggestResult !== null && (
              <ul className="mt-3 space-y-2">
                {suggestResult.length === 0 ? (
                  <li className="text-sm text-[hsl(var(--muted-foreground))]">No suggestions right now.</li>
                ) : (
                  suggestResult.map((s) => (
                    <li
                      key={s.id}
                      className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3 text-sm"
                    >
                      <strong className="text-[hsl(var(--foreground))]">{s.title}</strong>
                      <p className="mt-0.5 text-[hsl(var(--muted-foreground))]">{s.description}</p>
                    </li>
                  ))
                )}
              </ul>
            )}
            {activeTab === 'Generate Tests' && testsResult !== null && (
              <div className="mt-3">
                <button
                  type="button"
                  className="rounded-lg border border-[hsl(var(--border))] bg-transparent px-3 py-1.5 text-sm hover:bg-[hsl(var(--border))] focus:outline-none"
                  onClick={handleCopyTests}
                >
                  Copy code
                </button>
                <pre className="mt-2 max-h-96 overflow-auto rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3 text-xs font-mono text-[hsl(var(--foreground))] whitespace-pre">
                  {testsResult}
                </pre>
              </div>
            )}
            {activeTab === 'Explain' && explainResult !== null && (
              <div className="mt-3 prose prose-invert prose-sm max-w-none">
                <pre className="whitespace-pre-wrap rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3 text-[hsl(var(--foreground))] font-sans text-sm">
                  {explainResult}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40"
          onClick={onClose}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
          aria-hidden
        />
      )}
    </>
  );
}
