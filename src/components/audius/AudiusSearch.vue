<template>
  <Row class="header" gap="1">
    <Row class="container" padding=".5">
      <TextInput v-model="audius.query" name="query" placeholder="Search Audius" :autofocus="true" />
    </Row>

    <IconButton icon="close" @click="close" background="var(--pink)" />
  </Row>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { TextInput, IconButton, Row } from "..";
import { useAudius } from "../../stores/audius";

const audius = useAudius();
const router = useRouter();

function close() {
  router.push("/visualizer");
}
</script>

<style lang="scss" scoped>
.header {
  @include flex-row(start, center);
  @include position(fixed !important, 1rem 1rem null null, 100);
  border-radius: 1.75rem;
}

.container {
  background: $black;
  border-radius: 1.75rem;
}

.logo {
  @include size(80rem);
  @include position(fixed, -25rem null null -20rem, 0);
  opacity: 0.15;

  :deep(*) {
    fill: $purple;
  }
}

.close {
  z-index: 100;
  position: relative;
}
</style>
