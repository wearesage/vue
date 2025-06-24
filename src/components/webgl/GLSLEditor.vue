<template>
  <aside
    ref="container"
    @animationend="onAnimationEnd"
    :class="{ 'no-animate': noAnimate }"></aside>
</template>

<script setup lang="ts">
import { ref, toRefs } from "vue";
import { useGLSLEditor } from "../../composables/useGLSLEditor";

const props = defineProps<{
  modelValue: string;
  uniformKeys: string[];
  error: any;
}>();

const emit = defineEmits(["update:modelValue", "node-click"]);
const container = ref();
const refs = toRefs(props);
const noAnimate = ref(false);

useGLSLEditor(
  container,
  refs,
  (e: any) => emit("update:modelValue", e),
  (e: any) => emit("node-click", e)
);

const timeout = ref();

function onAnimationEnd() {
  clearTimeout(timeout.value);
  timeout.value = setTimeout(() => {
    noAnimate.value = true;
  }, 150);
}
</script>

<style lang="scss" scoped>
aside {
  @include position(fixed, 50% null null 0, 10);
  transform: translateY(-50%);
}
</style>

<style lang="scss">
.cm-highlightSpace:first-of-type,
.cm-highlightSpace:first-of-type ~ .cm-highlightSpace {
  position: relative !important;
  background: none !important;
  display: inline-block;
  padding-right: 0.1rem;

  &:before {
    @include size(100%, 1px);
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    transform: translateY(-50%);
    background: var(--light-gray-50);
    border-radius: 3px;
    content: "";
    display: block;
  }
}

*:not(span.cm-highlightSpace) ~ span.cm-highlightSpace {
  background: none !important;

  &:before {
    display: none !important;
  }
}

.cm-comment-line .cm-highlightSpace {
  opacity: 0.2 !important;
}

.cm-editor .cm-content .cm-empty-line {
  background: transparent !important;
}

.cm-editor,
.cm-editor * {
  outline: none !important;
}

.cm-line {
  max-width: 70vw;
  overflow-x: scroll;
  @include hide-scroll-bar;
}

.cm-line:not(.cm-comment-line) {
  border-bottom: 1px solid var(--white-10);
  background: rgba($black, 0.9) !important;
}

.cm-uniform:hover * {
  cursor: pointer;
}

.cm-line {
  @include cascade(500);
  transform-origin: top left;
}

.no-animate .cm-line {
  animation: none !important;
  opacity: 1 !important;
}

.cm-scroller {
  max-height: 100vh;
  overflow-y: scroll !important;
  @include hide-scroll-bar;
}

html body .cm-content {
  caret-color: $pink !important;
}
</style>
