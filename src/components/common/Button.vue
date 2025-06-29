<template>
  <button v-bind="$attrs" @click="$emit('click')">
    <slot />
  </button>
</template>

<script setup lang="ts">
defineEmits(["click"]);
</script>

<style lang="scss" scoped>
button {
  @include flex-row;
  @include box(0 1.5, 0.75);
  height: var(--element-size);
  background: var(--black);
  color: var(--white);
  border-radius: 2rem;
  font-family: var(--heading-font-family);
  font-style: var(--heading-font-style);
  transition: var(--hover-transition);

  &:hover {
    transform: scale(1.025);
    background: lighten($black, 15%) !important;
  }

  &:active {
    transform: scale(1);
  }

  @include mobile {
    transform: none !important;
  }
}
</style>
