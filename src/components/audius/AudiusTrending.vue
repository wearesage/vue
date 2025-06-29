<template>
  <Row>
    <div class="scroll">
      <Column>
        <h2>{{ title }}</h2>
      </Column>
      <AudiusArtwork v-for="(item, i) in audius.trending[type].week" :key="i" :item="item" @click="$emit('select', item)" />
    </div>
  </Row>
</template>

<script setup lang="ts">
import Row from "../layout/Row.vue";
import Column from "../layout/Column.vue";
import AudiusArtwork from "./AudiusArtwork.vue";
import { useAudius } from "../../stores/audius";

defineProps<{
  title: string;
  type: "playlists" | "tracks";
}>();

defineEmits(["select"]);

const audius = useAudius();
</script>

<style lang="scss" scoped>
.row,
.scroll {
  @include flex-row(start, start);
  @include scroll-bar;
  overflow-y: hidden;
  border-radius: 1rem;
  position: relative;
  width: 100%;
}

.scroll {
  @include flex-row(start, start);
  @include box(3 0, 0.5);
  overflow-x: auto;
  width: 100%;
  padding-left: 320px;

  > * {
    @include cascade(50);
  }
}

.column {
  @include flex-column(center !important, center !important);
  @include box(0 2 2 2, 1);
  position: absolute;
  top: 50%;
  left: 0;
  width: 320px;
  flex-shrink: 0;
  transform: translateY(-50%);
}

h2 {
  @include flex-column(start, start);
  border-radius: 0;
  font-size: 2rem;
  color: $purple !important;
  text-transform: lowercase;
}
</style>
