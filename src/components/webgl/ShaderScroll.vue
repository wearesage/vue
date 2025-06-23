<template>
  <TresGroup :position="[0, scrollOffset, 0]">
    <template v-for="(sketch, i) in sketches">
      <SketchMesh
        ref="meshes"
        @select="$emit('select', sketch)"
        :shader="sketch.shader"
        :uniforms="sketch.variants[0]"
        :width="width"
        :height="height"
        :scale="getScale(i)"
        :position="getPosition(i)"
        :rotation="[0, 0, Math.PI / 2]">
        <TresCircleGeometry :args="[0.175, 32]" />
      </SketchMesh>
    </template>
  </TresGroup>
</template>

<script setup lang="ts">
import SketchMesh from "./SketchMesh.vue";
import { type ShaderScrollProps } from "../../types/sketches";
import { useShaderLayout } from "../../composables";
import { computed, shallowRef } from "vue";

defineEmits(["select"]);

const props = withDefaults(defineProps<ShaderScrollProps>(), {
  sketches: [] as any,
  renderMode: "manual",
  volume: 1,
  stream: 0,
  animate: false,
  visible: false
});

const meshes = shallowRef();
const sketches = computed(() => props.sketches || []);

defineExpose({
  update(now: DOMHighResTimeStamp) {
    meshes.value?.forEach?.((val: any) => {
      try {
        val.update(now);
      } catch (e) {
        console.log(e);
      }
    });
  }
});

const { getPosition, getScale, scrollOffset } = useShaderLayout(props);
</script>
