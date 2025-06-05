<template>
  <Column
    is="section"
    class="scroll"
    :class="{ autoHideHeader, pad }">
    <header
      v-if="showHeader"
      ref="header"
      :class="{ visible: headerVisible }">
      <slot name="header"></slot>
      <Filter
        class="filter"
        type="text"
        v-model="query"
        :placeholder="placeholder" />
      <p
        class="stats"
        v-if="!viewport.isMobile && showTotal">
        Viewing {{ visible }} of {{ total }} {{ itemName }}.
      </p>
    </header>
    <ul
      ref="scroll"
      @scroll="onScroll">
      <Row
        class="scroll-item"
        is="li"
        v-for="i in appliedPagination"
        :key="filtered?.[i - 1]?._id || `${itemName}-${i}`"
        ref="items"
        :data-id="filtered?.[i - 1]?._id"
        @click="select(filtered?.[i - 1])">
        <slot v-bind="filtered?.[i - 1]"></slot>
      </Row>
    </ul>
    <footer>
      <slot name="footer"></slot>
    </footer>
    <ScrollInsights
      v-if="props.insights"
      :stats="stats"
      :keys="props.insights"
      :visible="showInsights"
      @update="onInsight" />
  </Column>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    data: any[];
    refs?: any;
    per?: number;
    exclude?: any[];
    placeholder?: string;
    itemName?: string;
    showTotal?: boolean;
    showHeader?: boolean;
    autoHideHeader?: boolean;
    insights?: string[] | null;
    pad?: boolean;
    showInsights?: boolean;
  }>(),
  {
    exclude: [] as any,
    refs: {},
    per: 50,
    placeholder: "search anything",
    itemName: "items",
    showTotal: true,
    showHeader: true,
    autoHideHeader: false,
    insights: null,
    pad: true,
    showInsights: false
  }
);

const viewport = useViewport();
const $emit = defineEmits(["select", "insight"]);
const observer = shallowRef<IntersectionObserver | null>(null);
const headerHeight = ref(0);
const header = ref();
const scroll = ref();
const { query, total, visible, filtered } = useFilteredCollection({ name: props.itemName, dataset: props.data, refs: props.refs, onUpdate, exclude: props.exclude });
const pagination = ref(props.per);
const appliedPagination = computed(() => Math.min(pagination.value, visible.value));
const paddingTop = computed(() => `${props.autoHideHeader ? headerHeight.value : 0}px`);
const scrollTop = ref(0);
const headerVisible = ref(true);
const items = ref();
const hashMap = computed(() =>
  props.data.reduce((acc, datum, i) => {
    acc[datum._id] = i;
    return acc;
  }, {})
);

const stats: any = ref(
  (props.insights || []).reduce(
    (acc: any, key) => {
      acc[key] = {};
      return acc;
    },
    { _id: {} }
  )
);

useResizeObserver(header, entries => {
  const entry = entries[0];
  headerHeight.value = entry.borderBoxSize[0].blockSize;
});

watch(() => appliedPagination.value, observeItems);

async function onInsight(e: any) {
  await nextTick();
  $emit("insight", { stats: stats.value, scores: e });
}

function onUpdate({ message }) {
  scroll.value.scrollTop = 0;
  pagination.value = props.per;
}

function select(e: any) {
  $emit("select", e);
}

function onScroll(e) {
  try {
    if (e.target.scrollTop === 0) {
      headerVisible.value = true;
      return;
    }

    if (e.target.scrollTop < scrollTop.value) {
      headerVisible.value = true;
    } else {
      headerVisible.value = false;
    }

    scrollTop.value = e.target.scrollTop;

    const atBottom = e.target.scrollTop + e.target.offsetHeight + 300 > e.target.scrollHeight;

    if (atBottom) {
      pagination.value += props.per;
    }
  } catch (e) {
    console.log(e);
  }
}

let map: any = {};

function onSeen({ datum: { attributes, _id }, duration }: any) {
  const _stats = clone(stats.value);

  _stats._id[_id] = _stats._id[_id] || 0;
  _stats._id[_id] += duration;

  (props.insights || []).forEach(key => {
    (attributes[key] || []).forEach(async (val: any) => {
      _stats[key][val] = _stats[key][val] || { dresses: 0, duration: 0 };
      _stats[key][val].dresses++;
      _stats[key][val].duration += duration;
    });
  });

  stats.value = _stats;
}

function createObserver() {
  observer.value = new IntersectionObserver(
    (entries: any) => {
      entries.forEach((entry: any) => {
        if (entry.isIntersecting) {
          if (!map[entry.target.dataset.id]) {
            map[entry.target.dataset.id] = window.performance.now();
          }
        } else {
          if (map[entry.target.dataset.id]) {
            onSeen({ datum: props.data?.[hashMap.value[entry.target?.dataset?.id]], duration: window.performance.now() - map[entry.target.dataset.id] });
            map[entry.target.dataset.id] = null;
          }
        }
      });
    },
    {
      root: scroll.value,
      threshold: [0.5]
    }
  );
}

async function observeItems() {
  if (!props.insights) return;
  await nextTick();
  if (!observer.value) createObserver();
  [...(scroll.value.querySelectorAll(".scroll-item") || [])].forEach(item => {
    observer.value?.unobserve(item);
    observer.value?.observe(item);
  });
}

onMounted(() => {
  observeItems();
});

onBeforeUnmount(() => {
  [...(scroll.value.querySelectorAll(".scroll-item") || [])].forEach(item => {
    observer.value?.unobserve(item);
  });

  observer.value?.disconnect();
});
</script>

<style lang="scss" scoped>
header {
  @include size(100%, auto);
  @include flex-row(space-between, center);
  @include box(0 1, 1);
  background: inherit;
}

.scroll {
  @include size(100%);
  position: relative;
  background: var(--light);

  .dark & {
    background: var(--black);
  }
}

.scroll-item {
  @include gap;
}

ul {
  @include size(100%);
  @include flex-column(start, start);
  padding-top: v-bind(paddingTop);
  overflow-y: scroll;
}

.pad {
  ul :deep(> li) {
    @include padding(0 1);
  }
}

ul :deep(li) {
  width: 100%;
}

.stats {
  font-size: 0.8rem;
}

.autoHideHeader {
  header {
    @include position(absolute, 0 0 null 0, 20);
    @include flex-row(space-between, center);
    @include box(0 1, 1);
    height: var(--element-size);
    overflow: hidden;
    transition: var(--transition);
    transform: translateY(-100%);

    &.visible {
      transform: translateY(0%);
    }
  }

  .scroll {
    // padding-top:
  }
}

.container {
  @include mobile {
    width: 100%;
  }
}

footer {
  @include position(absolute, null 0 0 0, 30);
  @include flex-row;
}
</style>
