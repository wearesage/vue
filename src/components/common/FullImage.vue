<template>
  <figure>
    <img :src="`/dresses/${src}`" :alt="alt" />
  </figure>
</template>

<script setup lang="ts">
defineProps<{
  src: string;
  alt?: string;
  size?: string;
}>()
</script>

<style lang="scss" scoped>
$pad: 0;

figure {
  position: relative;
  overflow: hidden;
  width: v-bind(size);

  $color: #8872f6;

  &:before {
    @include position(absolute, $pad $pad $pad $pad);
    content: '';
    pointer-events: none;
    background: radial-gradient(rgba($color, 0), rgba($color, .25));
  }


  &:after {
    @include position(absolute, 0 0 0 0);
    content: '';
    pointer-events: none;
    background: radial-gradient(rgba($color, .3), rgba($color, .1));
  }
}

img {
  @include size(100%);
  aspect-ratio: 740/800;
  object-fit: cover;
}
</style>