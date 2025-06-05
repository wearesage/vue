<template>
  <h1>{{ greeting }} <strong>Zach</strong></h1>
</template>

<script setup lang="ts">
const greeting = useRandomGreeting()
</script>

<style lang="scss" scoped>
h1 {
  @include position(absolute, 50% null null 50%);
  @include box(0 1);
  color: $white;
  transform: translateY(-50%) translateX(-75%);
  animation: fade-scale .75s $transition-easing;
  font-size: 3rem;
  text-transform: lowercase;
  border-bottom: 1px solid rgba($gray, .25);
  border-radius: 2rem;
  padding-bottom: 1rem;

  strong {
    text-transform: uppercase;
    color: $pink;
  }
}
</style>