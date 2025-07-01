<template>
  <header v-if="playlist">
    <h1>{{ playlist.playlist_name }}</h1>
    <h2>{{ playlist.user.handle }}</h2>
    <IconButton 
      icon="play" 
      label="Play All"
      @click="() => $emit('play-playlist', playlist)"
      class="play-button"
    />
  </header>
</template>

<script setup lang="ts">
import IconButton from "../common/IconButton.vue";

defineProps<{ playlist: any }>();

defineEmits<{
  'play-playlist': [playlist: any];
}>();
</script>

<style lang="scss" scoped>
header {
  @include flex-row(center, end);
  @include box(3 0, 1);
  width: 100%;
  border-bottom: 1px solid $purple;
}

h1 {
  font-size: 4rem;
  text-transform: lowercase;
}

h2 {
  color: $pink;
  margin: 0 auto 0 0;
}

.play-button {
  margin-left: auto;
}
</style>
