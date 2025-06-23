import { computed, isRef, type Ref } from "vue";

export type ReactiveValue = Ref<unknown> | unknown;

export function useReactiveValue(val: ReactiveValue) {
  const value = computed(() => (isRef(val) ? val.value : val));
  return value;
}
