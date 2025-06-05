<template>
  <Transition name="fade">
    <nav v-if="mainMenuVisible">
      <IconButton @click="toggleSource" :icon="visualizer.sourceIcon" />
      <IconButton v-if="visualizer.source === 'AUDIUS'" to="/audius" icon="vinyl" />
      <IconButton @click="toggleDesigns" icon="grid" />
      <IconButton @click="visualizer.toggleUniforms" icon="sliders" />
      <IconButton @click="visualizer.toggleChat" icon="technology" :active="visualizer.showChat" />
      <IconButton @click="toggleSettings" icon="settings" />
      <IconButton @click="share" icon="share" />
      <IconButton v-if="isSupported" @click="toggleFullscreen" icon="fullscreen" />
    </nav>
  </Transition>

  <Transition name="fade">
    <nav v-if="source">
      <h2>AUDIO SOURCE <IconButton icon="close" background="var(--pink)" @click="toggleSource" /></h2>
      <IconButton icon="spotify" @click="selectSource('SPOTIFY')" label="Spotify" />
      <IconButton icon="audius" @click="selectSource('AUDIUS')" label="Audius" />
      <IconButton icon="radio-paradise" @click="selectSource('RADIO_PARADISE')" label="Radio Paradise" />
      <IconButton icon="microphone" @click="selectSource('MICROPHONE')" label="Microphone" />
      <IconButton icon="upload" @click="selectSource('FILE')" label="File" />
      <IconButton icon="alien" label="Just Vibes" />
    </nav>
  </Transition>

  <Transition name="fade">
    <Settings v-if="settings" @toggle="toggleSettings" />
  </Transition>

  <Transition name="fade">
    <KeepAlive>
      <SketchBrowser v-if="designs" @close="toggleDesigns" />
    </KeepAlive>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useFullscreen } from "@vueuse/core";
import { type AudioSource } from "../../data/constants/audio-sources";
import { useViewport } from "../../stores/viewport";
import { useVisualizer } from "../../stores/visualizer";
import { useShare } from "../../composables/useShare";

const viewport = useViewport();
const visualizer = useVisualizer();
const visible = ref(false);
const source = ref(false);
const settings = ref(false);
const designs = ref(false);
const mainMenuVisible = computed(() => visible.value && !source.value && !visualizer.showUniforms && !settings.value && !designs.value);
const { isSupported, exit, enter, isFullscreen } = useFullscreen();
const timeout = ref<any>(null);
const share = useShare();

watch(
  () => viewport.mouse,
  () => {
    clearTimeout(timeout.value);
    visible.value = true;
    timeout.value = setTimeout(() => {
      visible.value = false;
    }, 2000);
  }
);

watch(
  () => visible.value,
  val => {
    document.body.classList[val ? "remove" : "add"]("no-cursor");
  }
);

function toggleFullscreen() {
  if (isFullscreen.value) {
    exit();
  } else {
    enter();
  }
}

function toggleSource() {
  source.value = !source.value;
}

function selectSource(src: AudioSource) {
  visualizer.selectSource(src);
  source.value = false;
}

function toggleSettings() {
  settings.value = !settings.value;
}

function toggleDesigns() {
  designs.value = !designs.value;
}
</script>

<style lang="scss" scoped>
nav {
  @include position(absolute, 0 env(safe-area-inset-right) 0 null, 100);
  @include flex-column(center, end);
  @include box(1, 0.5);
  overflow: hidden;

  > * {
    @include cascade;
    transform-origin: top right;
  }
}
</style>
