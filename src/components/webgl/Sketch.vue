<template>
  <TresCanvas class="sketch" @click="$emit('click')" :render-mode="'manual'" ref="canvas">
    <TresPerspectiveCamera :position="[0, 0, 1]" />
    <SketchMesh v-bind="{ shader, volume, stream, uniforms, animate, width, height, dpr }" ref="sketch">
      <slot />
    </SketchMesh>
  </TresCanvas>
</template>

<script setup lang="ts">
import { useAnimation } from "../../composables";
import { onBeforeUnmount, shallowRef } from "vue";
import SketchMesh from "./SketchMesh.vue";
import { type SketchProps } from "../../types/sketches";

defineEmits(["click"]);

const props = withDefaults(defineProps<SketchProps>(), {
  renderMode: "manual",
  volume: 1,
  stream: 0,
  animate: false,
  visible: true
});

const sketch = shallowRef();
const canvas = shallowRef();

const { start, stop } = useAnimation(
  now => {
    if (!canvas.value?.context) return;
    const { renderer, scene, camera } = canvas.value?.context;
    sketch.value?.update?.(now);
    renderer.value.render(scene.value, camera.value);
  },
  { autoStart: false }
);

onBeforeUnmount(stop);

if (props.animate) start();
</script>
