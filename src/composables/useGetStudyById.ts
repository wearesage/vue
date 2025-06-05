import { computed, ComputedRef, Ref } from "vue";
import { useSketches } from "../stores/sketches";

export function useGetStudyById(id: Ref | ComputedRef<string>) {
  const sketches = useSketches();
  const study = computed(() => sketches.studies.find((s: any) => s._id === id.value));
  return study;
}
