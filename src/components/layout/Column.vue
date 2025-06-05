<template>
  <component class="column" v-bind="$attrs" :is="is" :class="{ center, cascade }">
    <slot />
  </component>
</template>

<script lang="ts" setup>
import { computed } from "vue";
const props = withDefaults(defineProps<{ cascade?: boolean; is?: string; center?: boolean; padding?: number | string | boolean; gap?: number | string | boolean; width?: number | string }>(), {
  is: "div",
  gap: 0,
  padding: 0
});
const gapCss = computed(() => `${typeof props.gap === "boolean" && props.gap ? 1 : typeof props.gap === "number" ? props.gap : 0}rem`);
const paddingCss = computed(() => `${typeof props.padding === "boolean" && props.padding ? 1 : typeof props.padding === "number" ? props.padding : 0}rem`);
const widthCss = computed(() => (props.width ? props.width : "auto"));
</script>

<style lang="scss" scoped>
.column {
  @include flex-column(start, start);
  gap: v-bind(gapCss);
  padding: v-bind(paddingCss);
  width: v-bind(widthCss);
}

.center {
  @include flex-column;
}

.cascade > * {
  @include cascade(100);
}
</style>
