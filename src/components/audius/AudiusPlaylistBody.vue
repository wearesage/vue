<template>
  <Column is="section" :padding="3" :gap="3" cascade>
    <AudiusPlaylistHeader :playlist="playlist" />
    <AudiusTrackList :tracks="playlist?.tracks" />
  </Column>
</template>

<script setup lang="ts">
import Column from "../layout/Column.vue";
import AudiusPlaylistHeader from "./AudiusPlaylistHeader.vue";
import AudiusTrackList from "./AudiusTrackList.vue";

defineProps<{ playlist: any }>();
</script>

<style lang="scss" scoped>
section {
  @include flex-column(start, start);
  @include box(0 3, 2);
  position: relative;
  max-width: 1000px;
  margin: 50vh auto 3rem auto;
}
</style>
