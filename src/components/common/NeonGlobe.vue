<template>
  <canvas ref="canvas" :width="viewport.artboard.width" :height="viewport.artboard.height" :style="viewport.artboard.css" />
</template>

<script setup lang="ts">
import { ref, shallowRef, onMounted, onUnmounted, nextTick, watch } from "vue";
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

watch(
  () => [viewport.width, viewport.height, viewport.dpr],
  () => {
    if (!app.value?.renderer) return;
    app.value.renderer.setPixelRatio(viewport.dpr);
    app.value.renderer.setSize(viewport.width, viewport.height);
    app.value.camera.aspect = viewport.width / viewport.height;
    app.value.camera.updateProjectionMatrix();
  }
);

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
