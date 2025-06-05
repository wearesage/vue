<template>
  <section>
    <aside ref="glsl"></aside>
    <Shader ref="shader" v-if="sketch" :shader="sketch.shader" :uniforms="sketch.variants[0]" :stream="raf.time / 1000" :animate="true" :dpr="1" />
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import Shader from "../shaders/Shader.vue";
import { useRAF } from "../../stores/raf";
import { useGLSLEditor } from "../../composables/useGLSLEditor";

const props = defineProps<{
  sketch: any;
}>();

const glsl = ref();
const raf = useRAF();
const shader = ref();

useGLSLEditor(glsl, { shader: props.sketch.shader, uniforms: props.sketch.variants[0] }, (value: string) => {
  props.sketch.shader = value;
});

defineExpose({
  canvas: () => shader?.value?.canvas
});
</script>

<style lang="scss" scoped>
section {
  @include flex-row(center, start);
  @include box(1 0, 1);
  width: 100%;
  @include box(0.5, 1);
  border: 0.1rem solid rgba($purple, 0.15);
  border-radius: 1.5rem;
}

.shader {
  @include size(300px);
  overflow: hidden;
  flex-shrink: 0;
  :deep(canvas) {
    border-radius: 1rem;
    overflow: hidden;
  }
}

li {
  @include flex-row(start, center);
  @include box(0.1 0.5, 0.25);

  * {
    display: flex;
  }
}

.name {
  font-weight: 500;
  color: $pink;
}

.type {
  font-style: italic;
  opacity: 0.5;
}

.value {
  font-family: monospace;
  font-size: 0.8rem;
}

aside {
  flex: 1;

  :deep(> *) {
    @include size(100%, 300px);
    flex-grow: 0;
    background-color: transparent;
  }

  :deep(*) {
    outline: 0 !important;
  }

  :deep(.cm-gutters) {
    background-color: transparent;
  }

  :deep(.cm-activeLine) {
    background: rgba($white, 0.05) !important;
  }

  :deep(.ͼ1 .cm-content) {
    padding: 0;
  }
}
</style>
