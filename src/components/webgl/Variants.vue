<template>
  <Row class="variants" align="center" cascade is="ul" gap=".5">
    <slot name="left"></slot>

    <li
      v-for="(variant, i) in sketches.sketch?.variants || []"
      @click="sketches.selectVariant(i)"
      :class="{ active: i === sketches.variant }">
      <Sketch @click="sketches.selectVariant(i)" :animate="false" :shader="sketches.sketch?.shader || ''" :uniforms="variant" />
    </li>

    <slot name="right"></slot>
  </Row>
</template>

<script setup lang="ts">
import { Row, Sketch, useSketches } from "@wearesage/vue";

const sketches = useSketches();
</script>

<style lang="scss" scoped>
li {
  @include size(48px);
  border-radius: 3rem;
  overflow: hidden;
  transition: var(--transition);
  border: 2px solid transparent;
}

.active {
  border-color: $pink;
}
</style>
