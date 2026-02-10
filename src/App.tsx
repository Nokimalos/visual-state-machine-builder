import { useRef, useCallback, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useMachineModel } from './hooks/useMachineModel';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { Canvas } from './components/Canvas';
import { Sidebar } from './components/Sidebar';
import { Toolbar } from './components/Toolbar';
import { TemplateGallery } from './components/TemplateGallery';
import { ImportCodeModal } from './components/ImportCodeModal';
import { OnboardingTour } from './components/OnboardingTour';
import { EmptyState } from './components/EmptyState';
import { AIAssistantPanel } from './components/AIAssistantPanel';
import { Settings } from './components/Settings';
import { useOnboarding } from './hooks/useOnboarding';
import { TEMPLATES } from './components/TemplateGallery';
import { validateModel } from './model/validation';
import { generateCode, generateSnippetForAgent, downloadFile } from './utils/export';
import { addToHistory } from './utils/diagramHistory';
import { saveUserTemplate } from './utils/userTemplates';
import { getLayoutPositions } from './utils/layout';
import { getElkLayoutPositions } from './utils/autoLayout';
import { encodeState, decodeState, parseVsbmFile } from './utils/serialization';
import type { StateMachineModel } from './model/types';
import './index.css';
import './App.css';

function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasApiRef = useRef<import('./components/Canvas').CanvasApi | null>(null);
  const [userTemplatesVersion, setUserTemplatesVersion] = useState(0);
  const [sharedFromUrl, setSharedFromUrl] = useState(false);
  const [importCodeOpen, setImportCodeOpen] = useState(false);
  const [aiPanelOpen, setAIPanelOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(() => typeof localStorage !== 'undefined' && localStorage.getItem('vsmb-snap-to-grid') === 'true');
  const { shouldRun: onboardingRun, finish: onboardingFinish } = useOnboarding();
  const {
    model,
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
  } = useMachineModel();

  const validation = validateModel(model);
  const validationErrors = validation.errors.map((e) => e.message);

  // On mount: load state from ?state= if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stateParam = params.get('state');
    if (!stateParam) return;
    const decoded = decodeState(stateParam);
    if (decoded) {
      setModel(decoded);
      setSharedFromUrl(true);
      window.history.replaceState({}, '', window.location.pathname || '/');
    }
  }, []);

  const handleOpen = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as unknown;
        const model = parseVsbmFile(parsed);
        if (model) {
          setModel(model);
          setSharedFromUrl(false);
          toast.success('Diagram loaded', { description: `"${model.name}" opened from file.` });
        } else {
          toast.error('Invalid file', { description: 'File must be .vsmb.json or valid diagram JSON with states and transitions.' });
        }
      } catch {
        toast.error('Invalid JSON', { description: 'Could not parse the selected file.' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSave = () => {
    const filename = `${model.name.replace(/\s+/g, '') || 'machine'}.vsmb.json`;
    const payload = { version: 1, format: 'vsmb' as const, model };
    downloadFile(filename, JSON.stringify(payload, null, 2), 'application/json');
    addToHistory(model);
    toast.success('Saved', { description: `"${filename}" downloaded and added to history.` });
  };

  const handleOpenFromHistory = (historyModel: StateMachineModel) => {
    setModel(historyModel);
    setSharedFromUrl(false);
    toast.success('Opened from history', { description: `"${historyModel.name}"` });
  };

  const handleSaveAsTemplate = () => {
    const name = window.prompt('Template name', model.name || 'My template')?.trim();
    if (!name) return;
    saveUserTemplate(name, model);
    setUserTemplatesVersion((v) => v + 1);
    toast.success('Saved as template', { description: `"${name}" is in My templates.` });
  };

  const handleCopyCode = async () => {
    if (!validation.valid) {
      toast.error('Fix errors first', { description: validationErrors[0] ?? 'Validate your diagram before exporting.' });
      return;
    }
    const code = generateCode(model);
    await navigator.clipboard.writeText(code);
    toast.success('Code copied', { description: `${model.outputFormat} code is in your clipboard.` });
  };

  const handleDownload = () => {
    if (!validation.valid) {
      toast.error('Fix errors first', { description: validationErrors[0] ?? 'Validate your diagram before exporting.' });
      return;
    }
    const code = generateCode(model);
    const ext = model.outputLanguage === 'js' ? 'js' : 'ts';
    const filename = `${model.name.replace(/\s+/g, '') || 'machine'}.${ext}`;
    downloadFile(filename, code, ext === 'js' ? 'text/javascript' : 'text/typescript');
    toast.success('File downloaded', { description: `"${filename}"` });
  };

  const handleCopySnippetForAgent = async () => {
    if (!validation.valid) {
      toast.error('Fix errors first', { description: validationErrors[0] ?? 'Validate your diagram before exporting.' });
      return;
    }
    const snippet = generateSnippetForAgent(model);
    await navigator.clipboard.writeText(snippet);
    toast.success('Snippet copied', { description: 'Paste in Cursor/Copilot to share diagram + code.' });
  };

  const handleUpdateTransitionEvent = (id: string, event: string) => {
    updateTransition(id, { event });
  };

  const handleAddTransitionHint = useCallback(() => {
    toast.info('Add transition', {
      description: 'Connect two state nodes on the canvas (drag from one handle to another) to add a transition.',
    });
  }, []);

  const handleShare = useCallback(() => {
    const url = `${window.location.origin}${window.location.pathname || '/'}?state=${encodeState(model)}`;
    navigator.clipboard.writeText(url).then(() => toast.success('Link copied!'));
  }, [model]);

  const handleLayout = useCallback(async () => {
    if (model.states.length === 0) return;
    try {
      const positions = await getElkLayoutPositions(model);
      applyLayout(positions);
      toast.success('Diagram reorganized', { description: 'Flow laid out with ELK layout.' });
    } catch {
      const positions = getLayoutPositions(model);
      applyLayout(positions);
      toast.success('Diagram reorganized', { description: 'Flow laid out left → right by transitions.' });
    }
  }, [model, applyLayout]);

  const handleDuplicate = useCallback(
    (states: import('./model/types').StateNode[], transitions: import('./model/types').Transition[]) => {
      applyDuplicate(states, transitions);
      toast.success('Selection duplicated');
    },
    [applyDuplicate]
  );

  useKeyboardShortcuts({
    onSave: handleSave,
    onUndo: undo,
    onRedo: redo,
    onAddState: addState,
    onAddTransitionHint: handleAddTransitionHint,
    onSelectAll: () => canvasApiRef.current?.selectAll(),
    onDuplicate: () => canvasApiRef.current?.duplicate(),
  });

  return (
    <div className="app relative flex h-screen flex-col overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        accept=".vsmb.json,.json"
        className="hidden"
        onChange={handleFileChange}
        aria-label="Open diagram file"
      />
      <Toolbar
        model={model}
        machineName={model.name}
        sharedFromUrl={sharedFromUrl}
        onShare={handleShare}
        onImportFromCode={() => setImportCodeOpen(true)}
        canvasRef={canvasRef}
        onNameChange={setName}
        onNew={() => {
          reset();
          setSharedFromUrl(false);
          toast.success('New diagram', { description: 'Start from a template or add states on the canvas.' });
        }}
        onOpen={handleOpen}
        onSave={handleSave}
        onSaveAsTemplate={handleSaveAsTemplate}
        onOpenFromHistory={handleOpenFromHistory}
        onCopyCode={handleCopyCode}
        onDownload={handleDownload}
        onCopySnippetForAgent={handleCopySnippetForAgent}
        onUndo={undo}
        onRedo={redo}
        onLayout={handleLayout}
        onOpenAIPanel={() => setAIPanelOpen(true)}
        canUndo={canUndo}
        canRedo={canRedo}
        validationErrors={validationErrors}
      />
      <AIAssistantPanel
        isOpen={aiPanelOpen}
        onClose={() => setAIPanelOpen(false)}
        model={model}
        onOpenSettings={() => { setAIPanelOpen(false); setSettingsOpen(true); }}
      />
      <Settings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ImportCodeModal
        isOpen={importCodeOpen}
        onClose={() => setImportCodeOpen(false)}
        onImport={(model) => {
          setModel(model);
          setImportCodeOpen(false);
          toast.success('Diagram imported', { description: `${model.states.length} states from code.` });
        }}
      />
      {sharedFromUrl && (
        <div className="absolute left-4 top-16 z-20 rounded-md border border-[hsl(var(--accent))]/50 bg-[hsl(var(--accent))]/10 px-2 py-1 text-xs font-medium text-[hsl(var(--accent))]">
          Shared state machine
        </div>
      )}
      <div className="flex-shrink-0 overflow-y-auto border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3 max-h-[40vh]">
        <TemplateGallery onSelect={setModel} userTemplatesVersion={userTemplatesVersion} />
      </div>
      <OnboardingTour
        run={onboardingRun}
        onFinish={onboardingFinish}
        hasStates={model.states.length > 0}
      />
      <div className="app__main flex flex-1 min-h-0">
        <div className="app__canvas-wrap flex-1 min-w-0 relative">
          {model.states.length === 0 && (
            <EmptyState
              featuredTemplates={TEMPLATES.slice(0, 5).map((t) => ({ name: t.name, description: t.description, model: t.model }))}
              onSelectTemplate={setModel}
              onStartFromScratch={() => addState()}
            />
          )}
          <Canvas
            ref={canvasRef}
            canvasApiRef={canvasApiRef}
            onDuplicate={handleDuplicate}
            model={model}
            onAddTransition={(from, to, event) => {
              addTransition(from, to, event);
              toast.success('Transition added', { description: `"${event}" — connect more or edit in the sidebar.` });
            }}
            onUpdateTransitionEvent={handleUpdateTransitionEvent}
            onRemoveTransition={removeTransition}
            onRemoveState={removeState}
            onStatePositionChange={(stateId, position) => {
              if (snapToGrid) {
                const g = 20;
                position = { x: Math.round(position.x / g) * g, y: Math.round(position.y / g) * g };
              }
              updateState(stateId, { position });
            }}
          />
        </div>
        <Sidebar
          model={model}
          snapToGrid={snapToGrid}
          onSnapToGridChange={(v) => {
            setSnapToGrid(v);
            try {
              localStorage.setItem('vsmb-snap-to-grid', v ? 'true' : 'false');
            } catch {}
          }}
          onAddState={() => addState()}
          onUpdateState={updateState}
          onRemoveState={removeState}
          onSetInitialState={setInitialState}
          onUpdateTransitionEvent={handleUpdateTransitionEvent}
          onRemoveTransition={removeTransition}
          onOutputFormatChange={setOutputFormat}
          onOutputLanguageChange={setOutputLanguage}
        />
      </div>
    </div>
  );
}

export default App;
