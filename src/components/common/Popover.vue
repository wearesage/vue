<template>
  <aside @click="onClick">
    <slot />
  </aside>
</template>

<script setup lang="ts">
const viewport = useViewport();

viewport.popoverVisible = true;

const x = computed(() => viewport.clicked[0] + "px");
const y = computed(() => viewport.clicked[1] + "px");
const transform = computed(() => `translateX(${x.value}) translateY(${y.value})`);

watch(
  () => [x.value, y.value],
  () => {
    viewport.popoverVisible = false;
  }
);

function onClick(e: any) {
  e.stopImmediatePropagation();
}
</script>

<style lang="scss" scoped>
aside {
  @include position(fixed, 0 null null 0);
  transform: v-bind(transform);
  z-index: 100;
  background: var(--light);
}
</style>
