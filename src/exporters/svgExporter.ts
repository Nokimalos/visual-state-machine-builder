/**
 * Export the given DOM element as SVG and return a blob for download.
 * Uses html-to-image (toSvg). Caller should pass the React Flow container element.
 */
export async function exportToSvg(element: HTMLElement): Promise<Blob> {
  const { toSvg } = await import('html-to-image');
  const dataUrl = await toSvg(element, {
    pixelRatio: 2,
    backgroundColor: 'hsl(240, 10%, 4%)',
    cacheBust: true,
  });
  const res = await fetch(dataUrl);
  return res.blob();
}

export function downloadSvgBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
  a.click();
  URL.revokeObjectURL(url);
}
