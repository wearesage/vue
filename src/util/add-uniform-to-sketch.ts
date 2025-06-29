import type { Sketch, Variant, UniformValue } from "../types";
import { clone } from ".";
import { type Ref } from "vue";

export function addUniformToSketch(sketch: Ref<Sketch | null>, e: { type: string; value: string; name: string }): Sketch | null {
  const cloned = clone(sketch.value);
  if (cloned === null) return null;
  const value = e.type === "number" ? parseFloat(e.value) : e.value;
  cloned.variants.forEach((variant: Variant) => {
    variant[e.name] = { value: value as UniformValue };
  });
  return cloned as Sketch;
}
