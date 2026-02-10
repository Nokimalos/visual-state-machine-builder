import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import type { StateMachineModel } from '../model/types';
import { downloadFile } from '../utils/export';
import { exportToMermaid } from '../exporters/mermaidExporter';
import { exportTests } from '../exporters/testExporter';
import { exportToPng, downloadPngBlob } from '../exporters/pngExporter';
import { exportToSvg, downloadSvgBlob } from '../exporters/svgExporter';

export interface ExportMenuProps {
  model: StateMachineModel;
  validationValid: boolean;
  validationError?: string;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  onCopyCode: () => void;
  onDownloadCode: () => void;
  onCopySnippetForAgent: () => void;
}

export function ExportMenu({
  model,
  validationValid,
  validationError,
  canvasRef,
  onCopyCode,
  onDownloadCode,
  onCopySnippetForAgent,
}: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) {
      document.addEventListener('click', handler);
      return () => document.removeEventListener('click', handler);
    }
  }, [open]);

  const baseFilename = model.name.replace(/\s+/g, '') || 'machine';
  const ext = model.outputLanguage === 'js' ? 'js' : 'ts';

  const handleExportPng = async () => {
    if (!canvasRef.current) {
      toast.error('Canvas not ready', { description: 'Try again in a moment.' });
      return;
    }
    try {
      const blob = await exportToPng(canvasRef.current);
      downloadPngBlob(blob, `${baseFilename}.png`);
      toast.success('PNG downloaded', { description: `${baseFilename}.png` });
    } catch (err) {
      toast.error('Export failed', { description: err instanceof Error ? err.message : 'Could not export PNG.' });
    }
    setOpen(false);
  };

  const handleExportSvg = async () => {
    if (!canvasRef.current) {
      toast.error('Canvas not ready', { description: 'Try again in a moment.' });
      return;
    }
    try {
      const blob = await exportToSvg(canvasRef.current);
      downloadSvgBlob(blob, `${baseFilename}.svg`);
      toast.success('SVG downloaded', { description: `${baseFilename}.svg` });
    } catch (err) {
      toast.error('Export failed', { description: err instanceof Error ? err.message : 'Could not export SVG.' });
    }
    setOpen(false);
  };

  const handleCopyMermaid = () => {
    const mermaid = exportToMermaid(model);
    navigator.clipboard.writeText(mermaid).then(() => toast.success('Mermaid copied to clipboard'));
    setOpen(false);
  };

  const handleDownloadMermaid = () => {
    const mermaid = exportToMermaid(model);
    const md = `# ${model.name}\n\n\`\`\`mermaid\n${mermaid}\n\`\`\`\n`;
    downloadFile(`${baseFilename}.md`, md, 'text/markdown');
    toast.success('Markdown downloaded', { description: `${baseFilename}.md` });
    setOpen(false);
  };

  const handleCopyTests = () => {
    const tests = exportTests(model);
    navigator.clipboard.writeText(tests).then(() => toast.success('Tests copied to clipboard'));
    setOpen(false);
  };

  const handleDownloadTests = () => {
    const tests = exportTests(model);
    const testFilename = `${baseFilename}.test.${ext}`;
    downloadFile(testFilename, tests, ext === 'js' ? 'text/javascript' : 'text/typescript');
    toast.success('Tests downloaded', { description: testFilename });
    setOpen(false);
  };

  const needsValidDiagram = !validationValid;
  const disableCode = needsValidDiagram;

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className="rounded-lg bg-[hsl(var(--accent))] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2 focus:ring-offset-[hsl(var(--background))] disabled:opacity-50"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        title="Export options"
      >
        Export
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] py-1 shadow-xl">
          <div className="border-b border-[hsl(var(--border))] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Code
          </div>
          <button
            type="button"
            className="flex w-full px-3 py-2 text-left text-sm hover:bg-[hsl(var(--border))] focus:bg-[hsl(var(--border))] focus:outline-none disabled:opacity-50"
            onClick={() => { if (!disableCode) onCopyCode(); setOpen(false); }}
            disabled={disableCode}
            title={validationError}
          >
            Copy code
          </button>
          <button
            type="button"
            className="flex w-full px-3 py-2 text-left text-sm hover:bg-[hsl(var(--border))] focus:bg-[hsl(var(--border))] focus:outline-none disabled:opacity-50"
            onClick={() => { if (!disableCode) onDownloadCode(); setOpen(false); }}
            disabled={disableCode}
          >
            Download .{ext}
          </button>
          <button
            type="button"
            className="flex w-full px-3 py-2 text-left text-sm hover:bg-[hsl(var(--border))] focus:bg-[hsl(var(--border))] focus:outline-none disabled:opacity-50"
            onClick={() => { if (!disableCode) onCopySnippetForAgent(); setOpen(false); }}
            disabled={disableCode}
          >
            Snippet for AI
          </button>
          <div className="border-b border-[hsl(var(--border))] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Image
          </div>
          <button
            type="button"
            className="flex w-full px-3 py-2 text-left text-sm hover:bg-[hsl(var(--border))] focus:bg-[hsl(var(--border))] focus:outline-none disabled:opacity-50"
            onClick={handleExportPng}
          >
            Export as PNG
          </button>
          <button
            type="button"
            className="flex w-full px-3 py-2 text-left text-sm hover:bg-[hsl(var(--border))] focus:bg-[hsl(var(--border))] focus:outline-none"
            onClick={handleExportSvg}
          >
            Export as SVG
          </button>
          <div className="border-b border-[hsl(var(--border))] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Mermaid
          </div>
          <button
            type="button"
            className="flex w-full px-3 py-2 text-left text-sm hover:bg-[hsl(var(--border))] focus:bg-[hsl(var(--border))] focus:outline-none"
            onClick={handleCopyMermaid}
          >
            Copy Mermaid
          </button>
          <button
            type="button"
            className="flex w-full px-3 py-2 text-left text-sm hover:bg-[hsl(var(--border))] focus:bg-[hsl(var(--border))] focus:outline-none"
            onClick={handleDownloadMermaid}
          >
            Download .md
          </button>
          <div className="border-b border-[hsl(var(--border))] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Tests
          </div>
          <button
            type="button"
            className="flex w-full px-3 py-2 text-left text-sm hover:bg-[hsl(var(--border))] focus:bg-[hsl(var(--border))] focus:outline-none disabled:opacity-50"
            onClick={handleCopyTests}
            disabled={disableCode}
          >
            Copy tests
          </button>
          <button
            type="button"
            className="flex w-full px-3 py-2 text-left text-sm hover:bg-[hsl(var(--border))] focus:bg-[hsl(var(--border))] focus:outline-none disabled:opacity-50"
            onClick={handleDownloadTests}
            disabled={disableCode}
          >
            Download tests
          </button>
        </div>
      )}
    </div>
  );
}
