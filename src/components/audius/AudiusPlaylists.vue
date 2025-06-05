<template>
  <Row is="ul" width="100%" :gap="1" cascade>
    <template v-if="playlists.length">
      <li v-for="(playlist, i) in playlists" :key="i" @click="$emit('select', playlist)">
        <AudiusArtwork :item="playlist" />
      </li>
    </template>
    <li v-else class="none">
      <h2>Sorry!</h2>
      <p>No {{ item }} available.</p>
    </li>
  </Row>
</template>

<script setup lang="ts">
import Row from "../layout/Row.vue";
import AudiusArtwork from "./AudiusArtwork.vue";

withDefaults(
  defineProps<{
    playlists: any[];
    item?: "albums" | "playlists";
  }>(),
  {
    item: "playlists"
  }
);

defineEmits(["select"]);
</script>

<style lang="scss" scoped>
ul {
  @include flex-row(start, start);
  @include gap(1);
  width: 100%;
}

.row {
  @include flex-row(start, start);
  font-size: 1.5rem;
  line-height: 1;
}

h2 {
  justify-content: start;
  color: $pink;
  width: auto;
  font-size: 2rem;
  margin: 0;
}

p {
  margin: 0;
  justify-content: start;
}

.none {
  @include flex-row(start, end);
  @include gap;
  width: 100%;
}
</style>
