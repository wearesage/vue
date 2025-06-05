<template>
  <figure class="shader" :style="artboard" :class="{ fixed }">
    <TresCanvas :render-mode="renderMode">
      <TresPerspectiveCamera :position="[0, 0, 1]" />
      <TresMesh ref="mesh">
        <TresPlaneGeometry :args="[aspectRatio, 1]" />
        <TresShaderMaterial :key="fragmentShader" :vertex-shader="vertexShader" :fragment-shader="fragmentShader" :uniforms="uniforms" />
      </TresMesh>
    </TresCanvas>
  </figure>
</template>

<script lang="ts">
export type ShaderProps = {
  shader: string;
  uniforms: Record<string, { value: unknown }>;
  width?: number;
  height?: number;
  dpr?: number;
  animate?: boolean;
  volume?: number;
  stream?: number;
  fixed?: boolean;
  renderMode?: "always" | "manual" | "on-demand";
};
</script>

<script setup lang="ts">
import { shallowRef } from "vue";
import { useShader } from "../../composables/useShader";

const props = withDefaults(defineProps<ShaderProps>(), {
  renderMode: "always",
  volume: 1,
  stream: 0,
  animate: true
});

const mesh = shallowRef();
const { aspectRatio, vertexShader, fragmentShader, uniforms, artboard } = useShader(props, mesh);
</script>

<style lang="scss" scoped>
.fixed {
  position: fixed;
}
</style>
