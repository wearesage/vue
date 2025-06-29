import { ref, computed, type Ref } from "vue";

export function usePaginatedCollection(items: Ref<unknown[]>, total: number = 6) {
  const index = ref(0);

  const visible = computed(() => {
    const visible: any[] = [];
    for (let j = index.value; j < index.value + total; j++) {
      const item: any = items.value?.[j];
      if (item) visible.push(item);
    }
    return visible;
  });

  const pages = computed(() => {
    return Math.ceil(items.value.length / total);
  });

  const active = computed(() => {
    return Math.ceil(index.value / total) + 1;
  });

  function next() {
    if (index.value + total <= items.value.length) {
      index.value += total;
    }
  }

  function previous() {
    index.value = Math.max(0, index.value - total);
  }

  function selectPage(i: number) {
    index.value = i * total;
  }

  return {
    index,
    visible,
    next,
    pages,
    previous,
    active,
    selectPage,
  };
}
