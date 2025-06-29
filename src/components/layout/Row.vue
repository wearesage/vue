<template>
  <component class="row" ref="element" :is="is" :class="{ center, cascade, collapse }" v-bind="$attrs">
    <slot />
  </component>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { useTruthyNumber, useDimensionalStyleShorthand, useWithUnit } from "../../composables";
import { type LayoutProps, DEFAULT_LAYOUT_PROPS } from "../../types/layout";

const props = withDefaults(defineProps<LayoutProps>(), DEFAULT_LAYOUT_PROPS);
const width = computed(() => (props.width ? props.width : "fit-content"));
const height = computed(() => (props.height ? props.height : "fit-content"));
const numericGap = useTruthyNumber(props.gap);
const gap = useWithUnit(numericGap);
const padding = useDimensionalStyleShorthand(props.padding);
const element = ref();

defineExpose({ element });
</script>

<style lang="scss" scoped>
.row {
  display: flex;
  flex-direction: row;
  align-items: v-bind(align);
  justify-content: v-bind(justify);
  gap: v-bind(gap);
  padding: v-bind(padding);
  width: v-bind(width);
  height: v-bind(height);
  overflow: visible;
}

.center {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
}

.collapse {
  @include mobile {
    @include flex-column(start, start);
    width: 100%;
  }
}

.cascade > * {
  @include cascade(100);
}
</style>
