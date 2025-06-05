<template>
  <aside>
    <Row :gap="2" v-if="playlist">
      <Vinyl :src="playlist?.artwork?.['1000x1000']" />
      <Column :gap="0.5">
        <small>FEATURED</small>
        <h3>{{ playlist?.playlist_name }}</h3>
        <strong>{{ playlist?.user?.handle }}</strong>
      </Column>
    </Row>
  </aside>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import Row from "../layout/Row.vue";
import Column from "../layout/Column.vue";
import Vinyl from "../common/Vinyl.vue";
import { useAudius } from "../../stores/audius";

const ID = "jlJAMqZ";
const audius = useAudius();
const playlist = ref();

onMounted(() => {
  audius.fetchPlaylistById(ID).then(data => {
    playlist.value = data;
  });
});
</script>

<style lang="scss" scoped>
aside {
  @include flex-column(start, start);
  @include size(100vw, 100vh);
  position: relative;
  flex-shrink: 0;
  margin-bottom: -30vh;
}

h2 {
  display: block;
  padding: 0;
  color: $purple !important;
  margin: 0;
  width: fit-content;
  text-transform: lowercase;
}

h3 {
  font-size: 3rem;
  text-transform: lowercase;
  background: darken($black, 5%);
  padding: 1rem 1.5rem;
  border-radius: 2.5rem;
}

img {
  @include size(350px);
  border-radius: 25rem;
}

strong {
  font-size: 2rem;
  font-family: "Major Mono Display";
  color: $pink;
}

small {
  font-family: "Major Mono Display";
  color: $purple;
  text-transform: lowercase;
  font-size: 2rem;
}

.vinyl {
  @include size(100vh);
  @include position(absolute, -10% null null -13%);
  flex-shrink: 0;
  animation: rotate 33.333s linear infinite;
  box-shadow: 0 0 10rem darken($black, 10%);
  :deep(.overlays) {
    pointer-events: none;
    z-index: 100;
  }
}

.column {
  @include position(absolute, 40% null null 320px, 0);
  margin: 0;
  height: fit-content;
  transform: translateY(-50%);
  border-radius: 3rem;
}
</style>
