<template>
  <canvas ref="canvas" :width="viewport.artboard.width" :height="viewport.artboard.height" :style="viewport.artboard.css" />
</template>

<script setup lang="ts">
import { ref, shallowRef, onMounted, onUnmounted, nextTick } from "vue";
import { useViewport } from "../../stores/viewport";
import { useSketches } from "../../stores/sketches";
import { useAnimation } from "../../composables/useAnimation";
import { initGlobe } from "../../util/globe";

const viewport = useViewport();
const canvas = ref();
const app = shallowRef<any>({});
const initialized = ref(false);
const sketches = useSketches();

function initialize() {
  if (initialized.value || !canvas.value) return;
  nextTick().then(() => {
    app.value = initGlobe({ canvas, viewport });
    initialized.value = true;
  });
}

useAnimation(() => {
  if (!initialized.value) return;
  app.value.tick();
});

onMounted(() => {
  sketches.sampleSketches();
  initialize();
});

onUnmounted(() => {
  if (app.value) app.value.destroy();
});
</script>
