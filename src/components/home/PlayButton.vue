<template>
  <button class="play" @click="$emit('click')">
    <Transition name="fade">
      <PlayIcon v-if="!playing" />
    </Transition>
    <Transition name="fade">
      <PauseIcon v-if="playing" />
    </Transition>
  </button>
</template>

<script setup lang="ts">
import PlayIcon from "../../assets/icons/play.svg";
import PauseIcon from "../../assets/icons/pause.svg";

defineEmits(["click"]);

defineProps<{
  playing: boolean;
}>();
</script>

<style lang="scss" scoped>
.play {
  @include position(absolute, 50% null null 50%, 1000);
  @include size(5rem);
  @include flex;
  padding: 1.5rem;
  backdrop-filter: blur(2rem);
  background: $black;
  border-radius: 5rem;
  transform: translateX(-50%) translateY(-50%);
  transition: $hover-transition;
  border: 1px solid $purple;

  svg {
    @include size(30%);
    position: absolute;
  }

  :deep(svg) {
    fill: $white;
  }

  &:hover {
    opacity: 1;
    transform: translateX(-50%) translateY(-50%) scale(1.05);
  }

  &:active {
    transform: translateX(-50%) translateY(-50%) scale(0.95);
  }
}
</style>
