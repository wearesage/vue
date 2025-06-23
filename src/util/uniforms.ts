import { interpolateNumber, interpolateNumberArray } from "d3-interpolate";
import type { Sketch, Variant, UniformValue, AddUniformProps } from "../types/sketches";
import { clone } from "./clone";
import { type Ref } from "vue";

const INTEGER_KEYS = ["sides"];

function isIntegerKey(key: string) {
  return INTEGER_KEYS.includes(key);
}

function getMin(key: any, n: number, pow = 0.8) {
  if (isIntegerKey(key)) return 1;
  return Math.max(n - Math.pow(n, pow), 0);
}

function getMax(key: any, n: number, pow = 0.8) {
  if (isIntegerKey(key)) return 12;
  return Math.max(n + Math.pow(pow, 1));
}

function getStep(key: any) {
  return isIntegerKey(key) ? 1 : 0.001;
}

export const rangeUtils = {
  getMin,
  getMax,
  getStep,
};

export function buildVariantInterpolator(from: Variant, to: Variant) {
  const fromKeys = Object.keys(from);
  const toKeys = Object.keys(to);

  if (fromKeys.length !== toKeys.length) {
    console.warn(`TWEEN ERROR - Both variants must have the same keys.`);
  }

  const interpolator: Record<string, (t: number) => UniformValue> = {};

  Object.entries(from).forEach(([key, { value }]) => {
    if (Array.isArray(value) && Array.isArray(to[key].value)) {
      interpolator[key] = interpolateNumberArray(
        clone(from[key].value as [number, number, number]),
        clone(to[key].value as [number, number, number])
      );
    } else if (typeof value === "number" && typeof to[key].value === "number") {
      interpolator[key] = interpolateNumber(value, to[key].value);
    } else if (typeof value === "boolean") {
      interpolator[key] = (i: number) => to[key].value;
    }
  });

  return (i: number) => {
    return fromKeys.reduce((acc: Variant, key: string) => {
      acc[key] = { value: interpolator[key](i) as UniformValue };
      return acc;
    }, {});
  };
}

export function addUniformToSketch(sketch: Ref<Sketch | null>, e: { type: string; value: string; name: string }): Sketch | null {
  const cloned = clone(sketch.value);
  if (cloned === null) return null;
  const value = e.type === "number" ? parseFloat(e.value) : e.value;
  cloned.variants.forEach((variant: Variant) => {
    variant[e.name] = { value: value as UniformValue };
  });
  return cloned as Sketch;
}

export function patchUniformValueWithName(shader: Ref<string>, { name, range: [start, end] }: AddUniformProps) {
  const before = shader.value.slice(0, start);
  const after = shader.value.slice(end);
  return before + name + after;
}
