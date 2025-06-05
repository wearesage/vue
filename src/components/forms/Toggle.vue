<template>
  <div class="toggle">
    <input
      type="checkbox"
      :value="model"
      @input="onInput" />
    <i />
  </div>
</template>

<script setup lang="ts">
import { defineModel } from 'vue';

const model = defineModel();

function onInput({ target: { checked } }: any) {
  model.value = checked;
}
</script>

<style lang="scss" scoped>
.toggle {
  @include flex-row(start, start);
  @include size(3.5rem, 1.75rem);
  background: lighten($black, 5%);
  border-radius: 3.5rem;
  padding: 0;
  position: relative;
}

input {
  @include position(absolute, 0 0 0 0, 20);
  @include size(100%);
  opacity: 0;
}

i {
  @include size(1.75rem);
  transition: $transition;
  background: $black;
  border: 1px solid $pink;
  border-radius: 100%;
}

input:checked + i {
  background: $pink;
  transform: translateX(100%);
}
</style>
