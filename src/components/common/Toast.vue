<template>
  <header :class="{ visible: toast?.visible, [`${toast?.type}`]: true }">
    <img v-if="toast?.image" :src="toast?.image" />
    <p>{{ toast?.text }}</p>
  </header>
</template>

<script setup lang="ts">
import { useToast } from "../../stores/toast";

const toast = useToast();
</script>

<style lang="scss" scoped>
header {
  @include position(fixed, 0.5rem null null 50%, 205);
  @include flex(center, center, row);
  height: 3rem;
  opacity: 0;
  transform: translateX(-50%) translateY(-100%) translateY(-0.5rem);
  background: linear-gradient(to right, lighten(rgba(10, 10, 18, 1), 5%), darken(rgba(10, 10, 18, 1), 5%));
  pointer-events: none;
  transition: $transition;
  color: var(--white);
  padding: 0 1rem;
  border-radius: 100px;
  gap: 0.5rem;
  white-space: nowrap;

  *::first-letter {
    font-weight: 700;
  }
}

.visible {
  opacity: 1;
  transform: translateX(-50%) translateY(0%);
  pointer-events: all;
}

.message {
  background: linear-gradient(to right, lighten(rgba(10, 10, 18, 1), 5%), darken(rgba(10, 10, 18, 1), 5%));

  *::first-letter {
    color: var(--pink);
  }
}

.error {
  background: var(--red);
  transform: translateX(-50%) translateY(0%);
  box-shadow: var(--box-shadow);

  &.visible {
    transform: translateX(-50%) translateY(0%) scale(1);
  }

  *::first-letter {
    color: var(--black);
  }
}

img {
  @include size(auto, 80%);
  border-radius: 100%;
  overflow: hidden;
  display: flex;
  margin-left: -0.5rem;
}
</style>
