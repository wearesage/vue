import { watch, type Ref } from "vue";
import { useRefHistory, useMagicKeys } from "@vueuse/core";

export function useArrowControlledRefHistory(state: Ref<unknown>) {
  const { undo, redo } = useRefHistory(state, { deep: true });
  const { ArrowLeft, ArrowRight } = useMagicKeys();

  watch(ArrowLeft, (val) => val && undo());
  watch(ArrowRight, (val) => val && redo());
}
