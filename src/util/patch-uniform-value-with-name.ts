import type { AddUniformProps } from "../types/sketches";
import { type Ref } from "vue";

export function patchUniformValueWithName(shader: Ref<string>, { name, range: [start, end] }: AddUniformProps) {
  const before = shader.value.slice(0, start);
  const after = shader.value.slice(end);
  return before + name + after;
}
