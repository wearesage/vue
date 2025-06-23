import { hsl, rgb } from "d3-color";

export function hexToRgb(hex: string) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [-1, -1, -1];
}

export function glslColorToHex(color: [number, number, number]): string {
  const clampAndConvert = (value: number) => {
    const clamped = Math.max(0, Math.min(1, value));
    return Math.round(clamped * 255)
      .toString(16)
      .padStart(2, "0");
  };

  const [r, g, b] = color.map(clampAndConvert);
  return `#${r}${g}${b}`;
}

export function hexToGlslColor(hex: string): [number, number, number] {
  if (hex.startsWith("#")) {
    hex = hex.slice(1);
  }
  if (hex.length !== 6) {
    throw new Error("Invalid hex color format. Expected a 6-character string.");
  }

  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  return [r, g, b];
}

export function modelValueToHex(value: any, isWebgl: boolean): string {
  if (!value) return "#000000";

  if (isWebgl) {
    // Convert [r, g, b] array (0-1 range) to hex
    const [r, g, b] = value;
    const rgbColor = rgb(r * 255, g * 255, b * 255);
    return rgbColor.formatHex();
  } else {
    // Already a hex string
    return value;
  }
}

export function hexToModelValue(hex: string, isWebgl: boolean): any {
  if (isWebgl) {
    // Convert hex to [r, g, b] array (0-1 range)
    const color = rgb(hex);
    return [color.r / 255, color.g / 255, color.b / 255];
  } else {
    // Return hex string
    return hex;
  }
}

// Convert hex to HSL for easier manipulation
export function hexToHsl(hex: string) {
  const color = hsl(hex);
  return {
    h: color.h || 0,
    s: color.s || 0,
    l: color.l || 0,
  };
}

// Convert HSL back to hex
export function hslToHex(h: number, s: number, l: number) {
  const color = hsl(h, s, l);
  return color.formatHex();
}
