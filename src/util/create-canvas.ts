import { sizeCanvas } from "./size-canvas";

export function createCanvas({ parent, dpr }: { parent: HTMLElement; dpr: number }): HTMLCanvasElement {
  const canvas = document.createElement('canvas') as HTMLCanvasElement;
  const { width, height } = parent.getBoundingClientRect();
  sizeCanvas(canvas, { width, height, dpr });
  parent.appendChild(canvas);
  return canvas;
}