<template>
  <a
    v-if="href"
    :href="href"
    target="_blank"
    rel="noopener noreferrer"
    :style="{ background: background || 'var(--black)' }"
    class="icon-button"
    :class="{ propActive: active, disabled, small, label }"
    v-bind="$attrs">
    <span v-if="label">
      {{ label }}
    </span>
    <Icon :icon="icon" />
  </a>
  <button
    v-else
    :style="{ background: background || 'var(--black)' }"
    @click="handleClick"
    class="icon-button"
    :class="{ propActive: active, disabled, small, label }"
    v-bind="$attrs">
    <span v-if="label">
      {{ label }}
    </span>
    <Icon :icon="icon" />
  </button>
</template>

<script setup lang="ts">
import Icon from "./Icon.vue";
import { useRouter } from "../../router/sage-router";

const emit = defineEmits(["click"]);
const props = defineProps<{
  icon: any;
  background?: string;
  disabled?: boolean;
  active?: boolean;
  tooltip?: string;
  href?: string;
  to?: string;
  small?: boolean;
  label?: string | null;
}>();

const router = useRouter();

function handleClick(e: Event) {
  if (props.to) {
    router.push(props.to);
  } else {
    // Emit click for regular button behavior
    emit("click", e);
  }
}
</script>

<style lang="scss" scoped>
button,
a {
  @include size(3rem);
  @include flex-row(center, center);
  @include shadow;
  flex-shrink: 0;
  flex-grow: 0;
  margin: 1px 0;
  padding: 0;
  cursor: pointer;
  transition: $hover-transition;
  font-family: "Major Mono Display", monospace;


  &.label {
    @include box(1 1.25, 0.75);
    width: fit-content;
  }

  &:hover {
    transform: none;
    background: lighten($black, 3%);
    color: $purple;

    svg {
      transform: scale(1);
    }
  }

  &:active svg {
    transform: scale(0.8);
    color: $pink;
  }

  &.propActive {
    outline: 1px solid $pink;

    :deep(*) {
      fill: $pink !important;
    }
  }

  &.small {
    @include size(2rem);
  }
}

svg {
  opacity: 1;
  transform: scale(1);

  :deep(*) {
    fill: white;
  }
}

.disabled {
  opacity: 0.4;
  pointer-events: none;
}

button:hover,
a:hover {
  svg {
    opacity: 1;
  }
}
</style>
