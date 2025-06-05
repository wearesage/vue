<template>
  <component class="row" v-bind="$attrs" :is="is" :class="{ center, collapse, cascade }">
    <slot />
  </component>
</template>

<script lang="ts" setup>
import { computed } from "vue";

const props = withDefaults(defineProps<{ is?: string; center?: boolean; cascade?: boolean; collapse?: boolean; padding?: number | string | boolean; gap?: number | string | boolean; width?: number | string }>(), { is: "div" });
const gapCss = computed(() => `${typeof props.gap === "boolean" && props.gap ? 1 : typeof props.gap === "number" ? props.gap : 0}rem`);
const paddingCss = computed(() => `${typeof props.padding === "boolean" && props.padding ? 1 : typeof props.padding === "number" ? props.padding : 0}rem`);
const widthCss = computed(() => (props.width ? props.width : "auto"));
</script>

<style lang="scss" scoped>
.row {
  @include flex-row(start, start);
  gap: v-bind(gapCss);
  width: v-bind(widthCss);
  padding: v-bind(paddingCss);
}

.center {
  @include flex-row;
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
