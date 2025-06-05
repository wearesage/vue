<template>
  <Transition name="fade">
    <KeepAlive>
      <GLSLEditor v-if="visualizer.showUniforms && visualizer.showEditor" :shader="sketches.shader" :uniforms="sketches.uniforms" @update="sketches.updateShader" />
    </KeepAlive>
  </Transition>

  <Transition name="fade">
    <Uniforms v-if="visualizer.showUniforms" :uniforms="sketches.uniforms" />
  </Transition>
</template>

<script setup lang="ts">
import { useVisualizer } from "../../stores/visualizer";
import { useSketches } from "../../stores/sketches";

const visualizer = useVisualizer();
const sketches = useSketches();
</script>
