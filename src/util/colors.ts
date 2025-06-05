export function hexToRgb(hex: string) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [-1, -1, -1];
}

export function glslColorToHex(color: [number, number, number]): string {
  const clampAndConvert = (value: number) => {
    const clamped = Math.max(0, Math.min(1, value));
    return Math.round(clamped * 255)
      .toString(16)
      .padStart(2, '0');
  };

  const [r, g, b] = color.map(clampAndConvert);
  return `#${r}${g}${b}`;
}

export function hexToGlslColor(hex: string): [number, number, number] {
  if (hex.startsWith('#')) {
    hex = hex.slice(1);
  }
  if (hex.length !== 6) {
    throw new Error('Invalid hex color format. Expected a 6-character string.');
  }

  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  return [r, g, b];
}