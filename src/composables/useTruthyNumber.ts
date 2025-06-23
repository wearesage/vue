import { computed } from "vue";
import { useReactiveValue, type ReactiveValue } from "./useReactiveValue";

export function useTruthyNumber(val: ReactiveValue) {
  const rVal = useReactiveValue(val);
  const isNum = computed(() => typeof rVal.value === "number");
  const isStr = computed(() => typeof rVal.value === "string");
  const isEmptyStr = computed(() => typeof isStr.value && (rVal.value as string).length === 0);
  const isBool = computed(() => typeof rVal.value === "boolean");
  const value = computed(() => {
    const value = rVal.value;
    if (isNum.value) return value;
    if (isEmptyStr.value || isBool.value) return isEmptyStr.value ? 1 : value ? 1 : 0;
    if (!value) return 0;
    return parseFloat(value as string);
  });

  return value;
}
