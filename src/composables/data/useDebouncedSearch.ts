import { watch, ref } from "vue";

export function useDebouncedSearch(search: any, timeoutDuration = 300) {
  const query = ref("");
  const results = ref<any[]>([]);
  const timeout = ref();

  watch(
    () => query.value,
    async (val) => {
      if (val.length > 2) {
        clearTimeout(timeout.value);
        timeout.value = setTimeout(async () => {
          results.value = await search(query.value);
        }, timeoutDuration);
      } else {
        results.value = [];
      }
    }
  );

  return {
    query,
    results,
  };
}
