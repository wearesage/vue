<template>
  <component :style="{ background: background || 'var(--black)' }" :is="to ? 'RouterLink' : href ? 'a' : 'button'" :to="to" :href="href" @click="$emit('click')" class="icon-button" :icon="icon" :class="{ propActive: active, disabled, small, label }" v-bind="$attrs">
    <Icon :icon="icon" />
    <span v-if="label">
      {{ label }}
    </span>
  </component>
</template>

<script setup lang="ts">
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
  label?: string;
}>();
</script>

<style lang="scss" scoped>
button,
a {
  @include size(3rem);
  @include flex-row(center, center);
  transition: var(--hover-transition);
  flex-shrink: 0;
  flex-grow: 0;
  background: $black;
  border-radius: 3rem;
  padding: 0;
  cursor: pointer;
  outline: 1px solid transparent;

  * {
    pointer-events: none;
  }

  &.label {
    @include box(1 1.25, 0.75);
    width: fit-content;
  }

  &:hover {
    transform: none;
    background: lighten($black, 10%) !important;

    svg {
      transform: scale(1);
    }
  }

  &:active svg {
    transform: scale(0.8);
  }

  &.propActive {
    outline: 1px solid $pink !important;
  }
}

svg {
  transition: var(--hover-transition);
  opacity: 1;
  transform: scale(1);

  :deep(*) {
    transition: var(--hover-transition);
    fill: white;
  }
}

.disabled {
  opacity: 0.4;
}

button:hover,
a:hover {
  // background: lighten($black, 5%) !important;

  svg {
    opacity: 1;
  }
}
</style>
