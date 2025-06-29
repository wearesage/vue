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
  @include position(fixed, 1rem null null 50%, 205);
  @include flex(center, center, row);
  @include box(0.5 0.25 0.5 1, 0.5);
  height: 2.5rem;
  width: fit-content;
  opacity: 0;
  pointer-events: none;
  transform: translateX(-50%) translateY(calc(-100% - 1.5rem));
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
  background: $black;

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
