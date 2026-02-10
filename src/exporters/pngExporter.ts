/**
 * Export the given DOM element as PNG and return a blob for download.
 * Uses html-to-image (toPng). Caller should pass the React Flow container element.
 */
export async function exportToPng(element: HTMLElement): Promise<Blob> {
  const { toPng } = await import('html-to-image');
  const dataUrl = await toPng(element, {
    pixelRatio: 2,
    backgroundColor: 'hsl(240, 10%, 4%)',
    cacheBust: true,
  });
  const res = await fetch(dataUrl);
  return res.blob();
}

export function downloadPngBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  a.click();
  URL.revokeObjectURL(url);
}
