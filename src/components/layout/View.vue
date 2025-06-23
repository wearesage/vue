<template>
  <main ref="container" :class="{ centered, cascade }" @scroll="onScroll" @wheel="e => $emit('wheel', e.deltaY)">
    <slot></slot>
  </main>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
import { onMounted, ref } from "vue";

const route = useRoute();
const container = ref();
const LS_KEY = ref("view:scrollTop" + route.path);
const { centered = false, cascade = false } = defineProps<{
  centered?: boolean;
  cascade?: boolean;
}>();

const $emit = defineEmits(["wheel"]);

function onScroll(e: any) {
  localStorage.setItem(LS_KEY.value, `${e.target.scrollTop}`);
}

onMounted(() => {
  try {
    const saved = Number(localStorage.getItem(LS_KEY.value));
    if (!isNaN(saved)) container.value.scrollTop = saved;
  } catch (e) {
    // how many fucks were given
  }
});
</script>

<style lang="scss" scoped>
main {
  @include size(100vw, 100vh);
  @include flex-column(start, start);
  @include position(fixed, 0 null null 0);
  @include hide-scroll-bar;
  background: var(--black);
  overflow-y: scroll;
}

.centered {
  @include flex-column(center, center);
}

.cascade > * {
  @include cascade;
}
</style>
