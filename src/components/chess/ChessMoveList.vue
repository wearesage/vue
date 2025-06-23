<template>
  <ul v-if="state.moveList?.length">
    <li v-for="(move, i) in state.moveList" :key="`move-${i}`" :class="{ white: i % 2 === 0, black: i % 2 !== 0, [move.piece.type]: true }">
      <i v-if="i % 2 === 0">{{ i / 2 + 1 }}</i>
      <div class="notation">{{ move.notation }}</div>
    </li>
  </ul>
</template>

<script setup lang="ts">
defineProps<{
  state: any;
}>();
</script>

<style lang="scss" scoped>
$size: 200px;

ul {
  @include position(absolute, 0rem 0rem null null, 10);
  @include flex-row(start, start);
  @include box(0.5 0.5, 0);
  border-radius: 0.75rem;
  width: $size;
  flex-wrap: wrap;

  @include mobile {
    @include flex-row(start, start);
    @include box(0.25, 0);
    width: 100%;
    position: static;
    flex-wrap: wrap;
  }
}

div.notation::first-letter {
  font-family: "Noto Sans Symbols 2";
}

.white {
  background: $white;
  color: $black;
}

.black {
  background: $black;
  color: $white;
}

li {
  @include flex-row(end, start);
  @include box(0.5);
  position: relative;
  font-size: 1rem;
  width: 100%;
  max-width: calc(100px - 0.5rem);

  line-height: 1;
  font-family: monospace;
  border-radius: 0.5rem;

  &:nth-child(even) {
    // box-shadow: inset 0 0 0 px rgba($purple, 0.2);
  }

  @include mobile {
    @include box(0.75 0.5, 0);
    justify-content: end;
    display: flex;
    // flex-grow: 1;
    // flex-shrink: 0;
    flex-wrap: wrap;
    flex: 1;
    flex-shrink: 0;
    min-width: calc(50vw - 1rem);
    max-width: calc(50vw - 0.25rem);
  }
}

i {
  @include position(absolute, 50% null null 0.75rem);
  transform: translateY(-50%);
  display: inline-flex;
  // width: 1.25rem;
  flex-shrink: 0;
  flex-grow: 1;

  opacity: 0.5;
  font-size: 0.75rem;
}
</style>
