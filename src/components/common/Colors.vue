<template>
  <Column class="colors">
    <template v-for="(color, i) in value" :key="`${color.value}-${i}`">
      <figure :class="{ [color.name]: color.name }" :style="{ 'background-color': color.value }">&nbsp;</figure>
      <small>{{ color.name }}</small>
    </template>
  </Column>
</template>

<script setup lang="ts">
defineProps<{
  value: any[]
}>()
</script>

<style lang="scss" scoped>
.colors {
  @include gap(.75);
  align-items: center;
  width: 10rem;

  figure {
    @include size(2rem);
    flex-shrink: 0;
    border-radius: 100%;
    box-shadow: 0 0 1rem 0 rgba(0, 0, 0, .1);
  }
}
</style>