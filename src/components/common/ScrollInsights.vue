<template>
  <Row
    class="scroll-insights"
    v-if="visible">
    <template v-for="scoreKey in keys">
      <div>
        <div v-for="{ key, score, deviation } in scores[scoreKey]">
          <div class="score">
            <!-- <div class="bar" :style="getStyle(deviation / 2)">&nbsp;</div> -->
            <div
              class="bar purple"
              :style="getStyle(score)">
              &nbsp;
            </div>
          </div>
          <span>{{ key }}</span>
        </div>
      </div>
    </template>
  </Row>
</template>

<script setup lang="ts">
import { scaleLinear } from "d3-scale";

const props = defineProps<{ stats: any; keys: string[]; visible: boolean }>();
const emits = defineEmits(["update"]);
const scores: any = ref(
  Object.keys(props.keys).reduce((acc: any, key) => {
    acc[key] = {};
    return acc;
  }, {})
);

function getScore(dataset: any) {
  const { min, max, total, categories, i } = dataset.reduce(
    (acc: any, datum: any) => {
      acc.min = Math.min(datum.value.duration, acc.min);
      acc.max = Math.max(datum.value.duration, acc.max);
      acc.total += datum.value.duration / datum.value.dresses;
      acc.categories[datum.key] = acc.categories[datum.key] || {
        dresses: datum.value.dresses,
        total: 0,
        min: Infinity,
        max: -Infinity
      };
      acc.categories[datum.key].min = Math.min(datum.value.duration, acc.min);
      acc.categories[datum.key].max = Math.max(datum.value.duration, acc.max);
      acc.categories[datum.key].dresses = datum.value.dresses;
      acc.categories[datum.key].total += datum.value.duration;
      acc.i++;
      return acc;
    },
    { min: Infinity, max: -Infinity, total: 0, categories: {}, i: 0 }
  );

  const mean = total / i;

  const scales = Object.keys(categories).reduce((acc: any, key: any) => {
    const scale = scaleLinear([categories[key].min, categories[key].max], [0, 1]);
    acc[key] = scale;
    return acc;
  }, {});

  const scale = scaleLinear([min, max], [0, 1]);

  return Object.keys(scales).reduce((acc: any, key: any) => {
    acc.push({
      key,
      scale,
      scales,
      score: scale(categories[key].total).toFixed(2),
      deviation: ((categories[key].dresses / categories[key].total) * mean).toFixed(2)
    });
    return acc;
  }, []);
}

watch(
  () => props.stats,
  ({ _id, ...rest }: any) => {
    const keys = Object.keys(rest);

    scores.value = keys.reduce((acc: any, key) => {
      acc[key] = getScore(
        Object.keys(rest[key]).reduce((acc: any, kay) => {
          acc.push({
            key: kay,
            value: rest[key][kay]
          });
          return acc;
        }, [])
      );
      return acc;
    }, {});

    emits("update", scores.value);
  },
  {
    deep: true
  }
);

function getStyle(deviation: number) {
  return {
    height: deviation * 20 + "px"
  };
}
</script>

<style lang="scss" scoped>
.scroll-insights {
  @include position(fixed, null 0 0 0, 50);
  @include flex-row(end, end);
  @include box(1 1 0 1, 1);
  will-change: transform, opacity;
  background: linear-gradient(to top, var(--light), transparent);
  font-family: monospace;
  font-size: 0.5rem;
  pointer-events: none;

  > div {
    @include flex;
    width: 100px;
  }

  .score {
    @include flex-row(center);
    flex: 1;
  }

  .stat {
    @include flex-column(center, center);
  }

  .bar {
    display: flex;
    margin-top: auto;
    transition: var(--transition);
    background: var(--primary-color);
    width: 1rem !important;
    flex-grow: 0;
    will-change: transform, opacity;
  }
}
</style>
