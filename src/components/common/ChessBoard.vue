<template>
  <section class="chessboard" v-if="initialized">
    <div class="squares">
      <template v-for="row in 8">
        <div v-for="col in 8" :class="specialClasses({ row: row - 1, col: col - 1 })" @click="clickSquare({ row: row - 1, col: col - 1 })">&nbsp;</div>
      </template>
    </div>
    <div class="pieces">
      <div v-for="piece in state.pieces" class="piece" :style="{ transform: getPieceTransform(piece) }">
        <img :src="getSrc(piece)" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useChessMatch } from "../../composables/useChessMatch";
import { useSketches } from "../../stores/sketches";
import { useRAF } from "../../stores/raf";
import { useVisualizer } from "../../stores/visualizer";

const props = defineProps<{
  size?: number;
}>();

const css = computed(() => props.size + "px");
const raf = useRAF();

const visualizer = useVisualizer();
const sketches = useSketches();
const { state, getSrc, getPieceTransform, clickSquare, specialClasses, initialize, initialized } = useChessMatch();
const stream = computed(() => raf.time / 5000);

onMounted(initialize);
</script>

<style lang="scss" scoped>
.chessboard {
  @include flex;
  position: relative;
  width: v-bind(css);
  height: v-bind(css);
  user-select: none;

  overflow: hidden;

  .squares,
  .pieces {
    @include flex-row;
    @include position(absolute, 0 0 0 0, 0);
    flex-wrap: wrap;
    // mix-blend-mode: overlay;
  }

  .squares {
    @include position(absolute, 1rem 1rem 1rem 1rem, 0);

    > * {
      @include cascade(64, 3ms, 0);
    }
  }

  $border: 1px solid $white;

  .squares div {
    @include size(calc(100% / 8));
    @include flex;

    border-radius: edge(2);
    // border: 5%solid transparent;
    position: relative;
    transition: var(--hover-transition);

    &:before,
    &:after {
      @include position(absolute, 5% 5% 5% 5%, 50);
      // border: 0.25rem solid rgba($white, 0.25);
      border-radius: edge(2);
      content: "";
      opacity: 0;
      transition: var(--hover-transition);
    }

    &:after {
      background: linear-gradient(to top right, darken($pink, 0%), $orange);
    }

    &:before {
      border: edge(0.75) solid $orange;
    }

    &:nth-child(16n + 1),
    &:nth-child(16n + 3),
    &:nth-child(16n + 5),
    &:nth-child(16n + 7),
    &:nth-child(16n + 10),
    &:nth-child(16n + 12),
    &:nth-child(16n + 14),
    &:nth-child(16n + 16) {
      background: #969696;
    }
  }

  .pieces {
    @include position(absolute, 1rem 1rem 1rem 1rem, 30);
    animation: fade 1280ms var(--transition-easing) forwards;
    opacity: 0;
    pointer-events: none;
  }

  .piece {
    @include position(absolute, 0 null null 0, 10);
    @include size(calc(100% / 8));
    // box-shadow: 0 0 12rem 0.25rem rgba($purple, 0);
    transition: var(--hover-transition);
  }

  img {
    @include size(100%);
    transition: all 150ms var(--transition-easing);
  }

  img:hover {
    transform: scale(1.1);
  }

  img:active {
    transform: scale(0.95);
  }

  .selected:after {
    opacity: 1 !important;
  }

  .faded {
    opacity: 1;
  }
  .squares .possible {
    &:before {
      opacity: 1;
    }
  }

  .squares .last,
  .squares .from {
    &:after {
      opacity: 1 !important;
    }
  }
}

.shader {
  @include position(absolute, 0 0 0 0, 10);
  @include size(100% !important);
  pointer-events: none !important;
  mix-blend-mode: multiply;
  :deep(*) {
    pointer-events: none !important;
  }
}
</style>
