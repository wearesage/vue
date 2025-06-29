<template>
  <TresMesh ref="mesh" @click="$emit('select')" :visible="scale > 0" :position="position" :scale="scale">
    <slot>
      <TresPlaneGeometry :args="[aspectRatio, 1]" />
    </slot>
    <TresShaderMaterial :side="0" :vertex-shader="vertexShader" :fragment-shader="fragmentShader" :uniforms="uniforms" />
  </TresMesh>
</template>

<script setup lang="ts">
import { type SketchProps } from "../../types/sketches";
import { useShader } from "../../composables";
import { shallowRef } from "vue";

const $emit = defineEmits(["select"]);
const props = withDefaults(defineProps<SketchProps>(), {
  renderMode: "manual",
  volume: 1,
  stream: 0,
  animate: false,
  visible: true,
  position: [0, 0, 0] as any,
  scale: 1,
  meshKey: false
});

const mesh = shallowRef();
const { aspectRatio, vertexShader, fragmentShader, uniforms, render: prepShader } = useShader(props, mesh);

defineExpose({
  update: prepShader
});
</script>
