<template>
  <div class="text">
    <h1><span>See</span><span>The</span><span>Music</span></h1>
    <Row :gap="true">
      <button @click="router.push(`/visualizer`)" class="go">Let's Go</button>
      <PlayButton @click="visualizer.toggle" :playing="visualizer.playing" />
    </Row>
  </div>
</template>

<script setup lang="ts">
import Row from "../layout/Row.vue";
import PlayButton from "./PlayButton.vue";
import { useRouter } from "vue-router";
import { useVisualizer } from "../../stores/visualizer";

const router = useRouter();
const visualizer = useVisualizer();
</script>

<style lang="scss" scoped>
$border: 1px solid rgba($white, 0.25);

.text {
  @include flex-column(start, start);
  @include position(absolute, 50% null null 2rem, 220);
  @include box(2 10 2 2, 2);
  transform: translateY(-50%) translateX(30%);

  @include mobile {
    @include box;
    @include position(absolute, 50% null null 50%);
    transform: translate(-50%, -50%);
    width: 100%;
  }
}

button {
  @include box(0 2);
  @include flex-column(start, center);
  @include size(fit-content, 4rem);
  // backdrop-filter: blur(1rem);
  line-height: 4rem;
  font-size: 1.25rem;
  text-transform: uppercase;
  border-radius: 3rem;
  border: 0.1rem solid rgba($white, 1);
  transition: $hover-transition;
  // background: rgba($black, 1);
  animation-delay: 240ms;

  &:hover {
    background-color: rgba($black, 1);
    border-color: transparent;
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
}

h1 {
  font-size: 5rem;

  span {
    @include cascade(3, 80ms, 0ms);
    opacity: 0;
    display: block;
  }

  @include mobile {
    @include box(1 0, 0);
    font-size: 3rem;
  }
}
</style>
