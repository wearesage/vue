export function sizeCanvas(canvas: HTMLCanvasElement, { width, height, dpr }: { width: number; height: number; dpr: number }) {
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
}