<template>
  <component v-bind="$attrs" class="column" :is="is" :class="{ center, cascade }">
    <slot />
  </component>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useTruthyNumber, useDimensionalStyleShorthand, useWithUnit } from "../../composables";
import { type LayoutProps, DEFAULT_LAYOUT_PROPS } from "../../types/layout";

const props = withDefaults(defineProps<LayoutProps>(), DEFAULT_LAYOUT_PROPS);
const width = computed(() => (props.width ? props.width : "fit-content"));
const height = computed(() => (props.height ? props.height : "fit-content"));
const numericGap = useTruthyNumber(props.gap);
const gap = useWithUnit(numericGap);
const padding = useDimensionalStyleShorthand(props.padding);
</script>

<style lang="scss" scoped>
.column {
  display: flex;
  flex-direction: column;
  align-items: v-bind(align);
  justify-content: v-bind(justify);
  gap: v-bind(gap);
  padding: v-bind(padding);
  width: v-bind(width);
  height: v-bind(height);
}

.center {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
}

.cascade > * {
  @include cascade(100);
}
</style>
