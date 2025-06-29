<template>
  <TresGroup :position="[0, scrollOffset, 0]">
    <template v-for="(sketch, i) in sketches">
      <SketchMesh
        ref="meshes"
        @select="$emit('select', sketch)"
        :shader="sketch.shader"
        :uniforms="sketch.variants[0]"
        :width="width"
        :height="width"
        :volume="volume"
        :stream="stream"
        :visible="scalesByIndex[i] > 0"
        :scale="scalesByIndex[i]"
        :position="positionsByIndex[i]">
        <TresCircleGeometry :args="[device.isMobile ? 0.165 : 0.175, 32]" />
      </SketchMesh>
    </template>
  </TresGroup>
</template>

<script setup lang="ts">
import SketchMesh from "./SketchMesh.vue";
import { type ShaderScrollProps } from "../../types/sketches";
import { useShaderLayout } from "../../composables";
import { computed, shallowRef } from "vue";
import { useDevice } from "../../stores";

const device = useDevice();

defineEmits(["select"]);

const props = withDefaults(defineProps<ShaderScrollProps>(), {
  sketches: [] as any,
  renderMode: "manual",
  volume: 1,
  stream: 0,
  animate: true,
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
const scalesByIndex = computed(() => sketches.value.map((_, i) => getScale(i)));
const positionsByIndex = computed(() => sketches.value.map((_, i) => getPosition(i)));
</script>
