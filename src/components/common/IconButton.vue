<template>
  <component
    :style="{ background: background || 'var(--black)' }"
    :is="to ? 'RouterLink' : href ? 'a' : 'button'"
    :to="to"
    :href="href"
    @click="e => $emit('click', e)"
    class="icon-button"
    :icon="icon"
    :class="{ propActive: active, disabled, small, label }"
    v-bind="$attrs">
    <span v-if="label">
      {{ label }}
    </span>
    <Icon :icon="icon" />
  </component>
</template>

<script setup lang="ts">
import Icon from "./Icon.vue";

defineEmits(["click"]);

defineProps<{
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
</script>

<style lang="scss" scoped>
button,
a {
  @include size(3rem);
  @include flex-row(center, center);
  flex-shrink: 0;
  flex-grow: 0;
  background: $black;
  border-radius: 3rem;
  box-shadow: 0 2px 0 2px darken($black, 5%);
  margin: 1px 0;
  padding: 0;
  cursor: pointer;
  outline: 1px solid rgba($purple, 0.5);
  transition: $hover-transition;
  font-family: "Major Mono Display", monospace;

  * {
    pointer-events: none;
  }

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
