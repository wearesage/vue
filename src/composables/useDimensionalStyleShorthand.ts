import { computed } from "vue";
import { useReactiveValue, type ReactiveValue } from "./useReactiveValue";
import { type CSSUnit } from "../types/layout";

export function useDimensionalStyleShorthand(val: ReactiveValue, unit: CSSUnit = "rem") {
  const rVal = useReactiveValue(val);

  const set = computed(() => {
    if (typeof rVal.value === "string") {
      const split = (rVal.value as string).split(" ");
      const len = split.length;
      const vals = (len ? split : [1, 1, 1, 1]).map((v) => parseFloat(v as any) + unit);
      if (len === 1) return `${vals[0]} ${vals[0]} ${vals[0]} ${vals[0]}`;
      if (len === 2) return `${vals[0]} ${vals[1]} ${vals[0]} ${vals[1]}`;
      if (len === 3) return `${vals[0]} ${vals[1]} ${vals[2]} ${vals[1]}`;
      if (len === 0 || len === 4) return `${vals[0]} ${vals[1]} ${vals[2]} ${vals[3]}`;
    }
    return rVal.value;
  });

  return set;
}
