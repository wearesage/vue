<template>
  <Column class="track-list" width="100%" :gap="1" cascade>
    <Row is="li" v-for="(track, i) in tracks" :key="i" :gap="true" cascade>
      <img v-if="showArtwork" :src="track.artwork['480x480']" />
      <span class="number">{{ i + 1 }}</span>
      <strong>
        {{ track.title }}
        <div>{{ track.user?.handle }}</div>
      </strong>
      <span class="duration">{{ formatSeconds(track.duration) }}</span>
    </Row>
  </Column>
</template>

<script setup lang="ts">
import Column from "../layout/Column.vue";
import Row from "../layout/Row.vue";
import { formatSeconds } from "../../util/time";

withDefaults(
  defineProps<{
    tracks: any;
    showArtwork?: boolean;
  }>(),
  {
    showArtwork: true,
    tracks: []
  }
);
</script>

<style lang="scss" scoped>
.row {
  @include flex-row(start, start);
  width: 100%;
  font-size: 1.5rem;
  line-height: 1;
}

.number,
.duration {
  width: 3rem;
  flex-shrink: 0;
  font-size: 1.25rem;
}

.number {
  @include size(2rem);
  @include flex;
  border: 1px solid $purple;
  border-radius: 100%;
  font-size: 1rem;
}

.duration {
  display: flex;
  margin-left: auto;
  opacity: 0.25;
}

strong {
  @include flex-column(start, start);
  @include gap(0.5);

  div {
    font-size: 0.8rem;
    opacity: 0.5;
    font-weight: 900;
    font-family: "Major Mono Display";
  }
}

img {
  @include size(7rem);
  display: flex;
  border: 0.15rem solid rgba($purple, 1);
  margin-right: 1rem;
}

.duration {
  display: flex;
  margin-left: auto;
}
</style>
