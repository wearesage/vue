<template>
  <section class="datatable" @scroll="onScroll" ref="container">
    <table>
      <thead>
        <tr>
          <th :style="getStyle(i)" v-for="(column, i) in cols" :key="`header-${column}`" :data-key="cols[i]">
            <slot :name="`header_${keys[i]}`" v-bind="column">{{ Array.isArray(columns[i]) ? columns[i][1] : column }}
            </slot>
          </th>
        </tr>
      </thead>

      <tbody ref="body">
        <template v-for="(i, p) in activeIndices" :key="`${i}-${p}`" @click="$emit('click', __filtered_data?.[i])">
          <tr v-if="__filtered_data?.[i]">
            <td :style="getStyle(j)" :data-key="cols[j]" :class="{ empty: !__filtered_data?.[i]?.[key] }"
              v-for="(key, j) in __keys" :key="`${cols[j]}-${j}-${p}`">
              <slot :name="key" v-bind="__filtered_data?.[i]">
                <template v-if="debug">
                  <pre v-if="pre">{{ __filtered_data?.[i]?.[key] }}</pre>
                  <template v-else> {{ __filtered_data?.[i]?.[key] }}</template>
                </template>

                <template v-else>
                  <template v-if="__filtered_data?.[i]?.[key]?.type === 'date'">
                    <Date :value="__filtered_data?.[i]?.[key].value" />
                  </template>

                  <slot v-else v-bind="__filtered_data?.[i]">
                    <pre v-if="pre">{{ __filtered_data?.[i]?.[key] }}</pre>
                    <template v-else> {{ __filtered_data?.[i]?.[key] }}</template>
                  </slot>
                </template>
              </slot>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  data: any[];
  columns?: any[];
  hide?: any[];
  pagination?: number | null;
  filter?: string;
  selectable?: boolean;
  pre?: boolean,
  debug?: boolean;
  enrich?: boolean;
}>(), {
  columns: [] as any,
  hide: [] as any,
  pagination: 20,
  filter: '',
  selectable: true,
  pre: false,
  debug: false,
  enrich: true
})

const viewport = useViewport();

const win: any = window

win.__ENRICHMENT_MAP = win.__ENRICHMENT_MAP || {}

const emits = defineEmits(['click', 'filter-complete'])

function findDates(datum: Record<string, any>): string[] {
  return Object.keys(datum).reduce((acc: string[], key: string) => {
    if (typeof datum[key] === 'number') return acc
    const parsed = Date.parse(datum[key])
    if (!parsed || Number(parsed) !== parsed) return acc
    return [...acc, key]
  }, [] as string[])
}

function enrichData(dataset: Record<string, any>[]) {
  if (!dataset.length) return dataset
  const dates = findDates(dataset[0]).filter(v => v !== 'sizes')
  return dataset.map(datum => {
    if (win.__ENRICHMENT_MAP?.[datum?._id]) return win.__ENRICHMENT_MAP[datum._id]

    dates.forEach(dateKey => {
      const value = new Date(datum[dateKey])
      datum[`${dateKey}_formatted`] = new Intl.DateTimeFormat('en-US', {
        dateStyle: 'full',
        timeStyle: 'long',
      }).format(value)
    })


    if (datum.phone) {
      const [a, b, c, d, e, f, g, h, i, j] = datum.phone.replace('+1', '')
      datum.phone_formal = `(${a}${b}${c}) ${d}${e}${f}-${g}${h}${i}${j}`
      datum.phone_dashed = `${a}${b}${c}-${d}${e}${f}-${g}${h}${i}${j}`
    }

    win.__ENRICHMENT_MAP[datum._id] = datum
    return win.__ENRICHMENT_MAP[datum._id]
  })
}

const { ArrowLeft, ArrowRight } = useMagicKeys();
const __keys: any = shallowRef([]);
const __data: any = shallowRef([]);
const __data_string: any = shallowRef([]);
const __filtered_data: any = shallowRef(__data.value);
const __data_string_keys: any = shallowRef(getKeyStrings(__data.value))
const paginationIndex = ref(0);
const thumbprint = ref('')
const _pagination = ref(props.pagination);
const mounted = ref(false);
const container = ref();

function getStyle(i: number) {
  if (!mounted.value) return {}
  const value = `var(--${thumbprint.value}_${keys.value[i]})`
  return { width: value, 'min-width': value, 'max-width': value }
}
watchEffect(() => {
  if (ArrowLeft.value) {
    paginationIndex.value = Math.max(0, paginationIndex.value - 1);
  } else if (ArrowRight.value) {
    paginationIndex.value++;
  }
});

watch(() => props.data, () => {
  __data.value = Object.freeze(props.enrich ? enrichData(props.data) : props.data)
  __data_string.value = __data.value.map((v: any) => {
    return getStringValues(v)
  })
  __data_string_keys.value = getKeyStrings(__data.value)
  paginationIndex.value = 0;
  filterData();
}, {
  immediate: true
})

watch(
  () => props.filter,
  () => {
    paginationIndex.value = 0;
    _pagination.value = props.pagination
    filterData();
    emits('filter-complete', __filtered_data.value.length)
  },
  {
    immediate: true
  }
);

let timeout: any = 0;

watch(() => [viewport.width, viewport.height], async () => {
  keys.value.forEach((val, i) => {
    createCssVariable(`--${thumbprint.value}_${val}`, 'initial')
  })

  clearTimeout(timeout)

  timeout = setTimeout(() => {
    sizeColumns()
  }, 500)
})

const activeIndices = computed(() => {
  const [start, end] = _pagination.value === null ? [0, props.data.length - 1] : [
    paginationIndex.value * (_pagination.value - 1),
    paginationIndex.value * (_pagination.value - 1) + (_pagination.value - 1)
  ];
  const result = [];
  for (let i = start; i <= end; i++) result.push(i);
  return result;
});

const derivedKeys = computed(() => Object.keys(props.data?.[0] || {}));

const unfilteredKeys = computed(() => {
  if ((props.columns || []).length) return props.columns.map(v => Array.isArray(v) ? v[0] : v);
  return derivedKeys.value;
});

const keys = computed(() =>
  props.hide.length === 0
    ? unfilteredKeys.value
    : unfilteredKeys.value.filter(v => v.indexOf(props.hide) === -1)
);
const cols = computed(() => (keys.value).map(snakeToLabel));

watch(
  () => keys.value,
  val => {
    __keys.value = val;
    thumbprint.value = val.join('')
  },
  {
    immediate: true
  }
);

function filterData() {
  if (props.filter.length === 0) {
    __filtered_data.value = Object.freeze(__data.value)
    return
  }

  const results: any = [];

  const query = props.filter.toLowerCase().split(' ')


  __data_string.value.forEach((datum: string, i: number) => {
    if (query.every(query => datum.indexOf(query) > -1)) {
      results.push(__data.value[i])
    }
  });

  __filtered_data.value = Object.freeze(results);
  container.value.scrollTop = 0
}

async function sizeColumns() {
  await nextTick()
  const elements = [...document.querySelectorAll('tbody tr:first-child td')].map(v => `${v.getBoundingClientRect().width}px`)
  keys.value.forEach((val, i) => {
    createCssVariable(`--${thumbprint.value}_${val}`, elements[i])
  })
}

function onScroll(e: any) {
  if (e.target.scrollTop + e.target.offsetHeight === e.target.scrollHeight) {
    _pagination.value += props.pagination
  }
}

onMounted(async () => {
  await sizeColumns()
  mounted.value = true
})
</script>

<style lang="scss" scoped>
.datatable {
  @include size(100%);
  overflow-y: scroll;
  position: relative;
  max-height: 100%;
  overflow-y: auto;
}

table {
  @include size(100%);
  flex: 1;
  border-collapse: collapse;
}

td,
th {
  text-align: left;

  &:first-child {
    padding-left: 2rem;
  }
}

thead {
  font-weight: 900;
  box-shadow: 0 0 1rem 0 rgba(0, 0, 0, .25);
}

tr {
  position: relative;
  width: 100%;
  transition: var(--hover-transition);

  &:before {
    @include size(100%, 1px);
    @include position(absolute, 0 null null 0);
    // background: #2b2b2b;
    content: "";
  }

  th {
    @include box(2 1 2 1, 0)
  }

  td {
    @include box(0 1, 0);

    &:last-of-type {
      border-right: 0;
    }
  }

  &:nth-child(odd) {
    background: rgba(0, 0, 0, .05);

    .dark & {
      background: rgba(255, 255, 255, .025);
    }
  }
}

.select {
  width: var(--element-size);
}

@include mobile {
  thead {
    display: none;
  }

  table,
  tr {
    @include flex-row(start, start);
    @include box(0.5 0, 0.25);
    overflow-x: hidden;
    flex-wrap: wrap;
  }

  td {
    @include flex-column(start, start);
    @include box(0 1, 0);
    text-align: left;
  }

  [data-key]:before {
    content: attr(data-key);
    // text-transform: uppercase;
    opacity: 0.25;
    display: inline-flex;
    text-align: left;
    flex: 1;
  }
}

.pagination {
  @include position(fixed, var(--viewport-height) 0 0 null);
  display: none;
  transform: translateY(-100%);
}

pre {
  text-align: left;
  padding: 0;
}
</style>
