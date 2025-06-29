import { computed } from "vue";
import { type CSSUnit } from "../../types/layout";
import { useReactiveValue, ReactiveValue } from "../";

export function useWithUnit(val: ReactiveValue, unit: CSSUnit = "rem") {
  const rV = useReactiveValue(val);
  const value = computed(() => `${rV.value}${unit}`);
  return value;
}
