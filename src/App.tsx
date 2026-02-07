import { useRef } from 'react';
import { toast } from 'sonner';
import { useMachineModel } from './hooks/useMachineModel';
import { Canvas } from './components/Canvas';
import { Sidebar } from './components/Sidebar';
import { Toolbar } from './components/Toolbar';
import { TemplateGallery } from './components/TemplateGallery';
import { validateModel } from './model/validation';
import { generateCode, generateSnippetForAgent, downloadFile } from './utils/export';
import type { StateMachineModel } from './model/types';
import './index.css';
import './App.css';

function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    model,
    setModel,
    setName,
    setOutputFormat,
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
    canUndo,
    canRedo,
  } = useMachineModel();

  const validation = validateModel(model);
  const validationErrors = validation.errors.map((e) => e.message);

  const handleOpen = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as StateMachineModel;
        if (parsed.states && Array.isArray(parsed.states) && Array.isArray(parsed.transitions)) {
          setModel(parsed);
          toast.success('Diagram loaded', { description: `"${parsed.name}" opened from file.` });
        } else {
          toast.error('Invalid file', { description: 'JSON must contain states and transitions arrays.' });
        }
      } catch {
        toast.error('Invalid JSON', { description: 'Could not parse the selected file.' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSave = () => {
    const filename = `${model.name.replace(/\s+/g, '') || 'machine'}.json`;
    downloadFile(filename, JSON.stringify(model, null, 2), 'application/json');
    toast.success('Saved', { description: `"${filename}" downloaded.` });
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
    const filename = `${model.name.replace(/\s+/g, '') || 'machine'}.ts`;
    downloadFile(filename, code, 'text/typescript');
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

  return (
    <div className="app flex min-h-screen flex-col">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
        aria-label="Open JSON file"
      />
      <Toolbar
        model={model}
        machineName={model.name}
        onNameChange={setName}
        onNew={() => {
          reset();
          toast.success('New diagram', { description: 'Start from a template or add states on the canvas.' });
        }}
        onOpen={handleOpen}
        onSave={handleSave}
        onCopyCode={handleCopyCode}
        onDownload={handleDownload}
        onCopySnippetForAgent={handleCopySnippetForAgent}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        validationErrors={validationErrors}
      />
      <div className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3">
        <TemplateGallery onSelect={setModel} />
      </div>
      <div className="app__main flex flex-1 min-h-0">
        <div className="app__canvas-wrap flex-1 min-w-0">
          <Canvas
            model={model}
            onAddTransition={(from, to, event) => {
              addTransition(from, to, event);
              toast.success('Transition added', { description: `"${event}" — connect more or edit in the sidebar.` });
            }}
            onUpdateTransitionEvent={handleUpdateTransitionEvent}
            onRemoveTransition={removeTransition}
            onRemoveState={removeState}
            onStatePositionChange={(stateId, position) => updateState(stateId, { position })}
          />
        </div>
        <Sidebar
          model={model}
          onAddState={() => addState()}
          onUpdateState={updateState}
          onRemoveState={removeState}
          onSetInitialState={setInitialState}
          onUpdateTransitionEvent={handleUpdateTransitionEvent}
          onRemoveTransition={removeTransition}
          onOutputFormatChange={setOutputFormat}
        />
      </div>
    </div>
  );
}

export default App;
