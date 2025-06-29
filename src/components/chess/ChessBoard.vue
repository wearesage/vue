<template>
  <section
    class="chessboard"
    v-if="initialized">
    <div class="squares">
      <template v-for="row in 8">
        <div
          v-for="col in 8"
          :class="specialClasses({ row: row - 1, col: col - 1 })"
          @click="clickSquare({ row: row - 1, col: col - 1 })"></div>
      </template>
    </div>
    <div class="pieces">
      <div
        v-for="piece in state.pieces"
        class="piece"
        :style="{ transform: getPieceTransform(piece) }">
        <img :src="getSrc(piece)" />
      </div>
    </div>

    <ol class="numbers">
      <li><span>1</span></li>
      <li><span>2</span></li>
      <li><span>3</span></li>
      <li><span>4</span></li>
      <li><span>5</span></li>
      <li><span>6</span></li>
      <li><span>7</span></li>
      <li><span>8</span></li>
    </ol>

    <ul class="letters">
      <li><span>A</span></li>
      <li><span>B</span></li>
      <li><span>C</span></li>
      <li><span>D</span></li>
      <li><span>E</span></li>
      <li><span>F</span></li>
      <li><span>G</span></li>
      <li><span>H</span></li>
    </ul>
  </section>

  <ChessMoveList :state="state" />
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from "vue";
import ChessMoveList from "./ChessMoveList.vue";
import { useChessMatch } from "../../composables";

const props = defineProps<{
  size?: number;
}>();

const emit = defineEmits(["update"]);
const css = computed(() => props.size + "px");

const { state, getSrc, getPieceTransform, clickSquare, specialClasses, initialize, initialized } = useChessMatch();

watch(
  () => state.value,
  val => {
    emit("update", val);
  },
  {
    deep: true
  }
);

onMounted(initialize);
</script>

<style lang="scss" scoped>
$pad: 0;

.chessboard {
  @include gap;
  @include flex;
  position: relative;
  width: v-bind(css);
  height: v-bind(css);
  user-select: none;
  flex-shrink: 0;

  .squares,
  .pieces {
    @include flex-row;
    @include position(absolute, 0 0 0 0, 0);
    flex-wrap: wrap;
  }

  .squares {
    > * {
      @include cascade(64, 3ms, 0);
    }
  }

  .squares div {
    @include size(calc(100% / 8));
    @include flex;
    // transform: scale(0.975) !important;
    position: relative;
    transition: var(--hover-transition);

    &:before,
    &:after {
      @include position(absolute, 0% null null 0%);
      @include size(100%);

      // transform: scale(0.9);
      content: "";
      opacity: 0;
      transition: var(--hover-transition);
    }

    &:after {
      background: linear-gradient(to top right, darken($purple, 0%), $orange);
    }

    &:before {
      box-shadow: inset 0 0 0 edge(0.25) $orange;
    }

    &:nth-child(16n + 1),
    &:nth-child(16n + 3),
    &:nth-child(16n + 5),
    &:nth-child(16n + 7),
    &:nth-child(16n + 10),
    &:nth-child(16n + 12),
    &:nth-child(16n + 14),
    &:nth-child(16n + 16) {
      background: #a1a0a0;
    }
  }

  .pieces {
    @include position(absolute, $pad $pad $pad $pad, 30);
    animation: fade 1280ms var(--transition-easing) forwards;
    opacity: 0;
    pointer-events: none;
  }

  .piece {
    @include position(absolute, 0rem null null 0rem, 10);
    @include size(auto, calc(100% / 8));
    // box-shadow: 0 0 12rem 0.25rem rgba($purple, 0);
    transition: var(--hover-transition);
  }

  img {
    @include size(100%);
    transition: all 150ms var(--transition-easing);
    transform: scale(0.9);
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

.numbers,
.letters {
  @include position(absolute, auto 0 null null, 0);
  // @include box(0.5, 0.5);
  pointer-events: none;
  display: flex;
  flex-direction: column-reverse;
  font-family: monospace;
  font-size: 0.75rem;
  overflow: hidden;
  animation: fade 1280ms var(--transition-easing) forwards;

  li {
    @include size(calc(100% / 8));
    overflow: hidden;
  }

  span {
    @include flex;
    @include size(fit-content);
    @include box(0.25, 0.25);
    // background: #8c8c8d;
    color: rgba($white, 0.5);
    font-size: 0.6rem;
  }
}

.numbers {
  @include flex-column(end, end);
  flex-direction: column-reverse;
  width: 100%;
  height: 100%;
  left: 0;
  right: 0;
  background-color: transparent !important;

  span {
    @include flex;
    margin-left: auto;
  }

  li {
    // @include size(2rem);
    flex-shrink: 0;
    flex: 1;
    background-color: transparent !important;
  }
}

.letters {
  @include position(absolute, null 0 0 0);
  @include flex-row(start, start);
  width: 100%;
  height: auto;

  li {
    @include flex-row(start, end);
  }

  span {
    // @include box(0.25, 0.25);
  }
}
</style>
