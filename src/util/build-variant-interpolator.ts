import { interpolateNumber } from "d3-interpolate";
import type { Variant, UniformValue } from "../types/sketches";

export function buildVariantInterpolator(from: Variant, to: Variant) {
  const fromKeys = Object.keys(from);
  const toKeys = Object.keys(to);

  if (fromKeys.length !== toKeys.length || !fromKeys.every((key, i) => key === toKeys[i])) {
    console.warn(`TWEEN ERROR - Both variants must have the same keys.`);
  }

  const interpolator: Record<string, (t: number) => UniformValue> = {};

  Object.entries(from).forEach(([key, { value }]) => {
    if (Array.isArray(value) && Array.isArray(to[key].value)) {
      const interpolators = value.map((val, i) => interpolateNumber(val, (to as any)[key].value[i] as number));
      interpolator[key] = (i) => interpolators.map((interp) => Number(interp(i).toFixed(5)));
    } else if (typeof value === "number" && typeof to[key].value === "number") {
      const interp = interpolateNumber(value, to[key].value);
      interpolator[key] = (i: number) => Number(interp(i).toFixed(5));
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
