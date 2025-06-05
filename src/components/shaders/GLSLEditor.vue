<template>
  <aside ref="container"></aside>
</template>

<script setup lang="ts">
import { ref, toRefs, type Ref } from "vue";
import { useGLSLEditor } from "../../composables/useGLSLEditor";

const props = defineProps<{
  shader: string;
  uniforms: Ref<string, { value: unknown }>;
}>();

const emit = defineEmits(["update"]);
const container = ref();
const refs = toRefs(props);

useGLSLEditor(container, refs, (e: any) => emit("update", e));
</script>

<style lang="scss" scoped>
aside {
  @include position(absolute, 0 0 0 0, 20);
}
</style>
