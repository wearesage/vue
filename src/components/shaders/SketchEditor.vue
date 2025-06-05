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
import { KeepAlive, Transition } from "vue";
import { useVisualizer } from "../../stores/visualizer";
import { useSketches } from "../../stores/sketches";
import GLSLEditor from "../shaders/GLSLEditor.vue";
import Uniforms from "../shaders/Uniforms.vue";

const visualizer = useVisualizer();
const sketches = useSketches();
</script>
