<template>
  <figure>
    <img :src="src" :alt="alt" />
  </figure>
</template>

<script setup lang="ts">
defineProps<{
  src: string;
  alt?: string;
}>()
</script>

<style lang="scss" scoped>
figure {
  @include size(10vw, 20vw);
  position: relative;
  display: block;
  overflow: hidden;
}

img {
  @include size(100%);

  object-fit: cover;
}
</style>