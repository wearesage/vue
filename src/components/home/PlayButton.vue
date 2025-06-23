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
  @include size(4rem);
  @include flex;
  position: relative;
  border-radius: 5rem;
  transition: $hover-transition;
  border: 0.1rem solid rgba($white, 1);

  svg {
    @include size(40%);
    position: absolute;
  }

  :deep(svg) {
    fill: $white;
  }

  &:hover {
    opacity: 1;
    transform: scale(1.05);
    border-color: transparent;
  }

  &:active {
    transform: scale(0.95);
  }
}
</style>
