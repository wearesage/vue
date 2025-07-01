<template>
  <Column is="section" :padding="3" :gap="3" cascade>
    <AudiusPlaylistHeader :playlist="playlist" @play-playlist="handlePlayPlaylist" />
    <AudiusTrackList :tracks="playlist?.tracks" @play-track="handlePlayTrack" />
  </Column>
</template>

<script setup lang="ts">
import Column from "../layout/Column.vue";
import AudiusPlaylistHeader from "./AudiusPlaylistHeader.vue";
import AudiusTrackList from "./AudiusTrackList.vue";

defineProps<{ playlist: any }>();

// We'll get the track adapter from the parent page, so emit the events up
const emit = defineEmits<{
  'play-playlist': [playlist: any];
  'play-track': [track: any, index: number];
}>();

function handlePlayPlaylist(playlist: any) {
  // Forward the event to parent
  emit('play-playlist', playlist);
}

function handlePlayTrack(track: any, index: number) {
  // Forward the event to parent
  emit('play-track', track, index);
}</script>

<style lang="scss" scoped>
section {
  @include flex-column(start, start);
  @include box(0 3, 2);
  position: relative;
  max-width: 1000px;
  margin: 50vh auto 3rem auto;
}
</style>
