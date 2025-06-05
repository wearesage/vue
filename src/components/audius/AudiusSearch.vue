<template>
  <header>
    <Input v-model="audius.query" type="text" name="query" placeholder="Search Audius" :autofocus="true" />
    <IconButton icon="close" @click="close" background="var(--pink)" />
  </header>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import Input from "../forms/Input.vue";
import IconButton from "../common/IconButton.vue";
import { useAudius } from "../../stores/audius";

const audius = useAudius();
const router = useRouter();

function close() {
  router.push("/visualizer");
}
</script>

<style lang="scss" scoped>
header {
  @include flex-row(start, center);
  @include box(2 2 2 1, 1);
  z-index: 100;
  right: 0;
  position: absolute;
  max-width: 400px;
  margin-left: auto;
  width: 100%;
}

.logo {
  @include size(80rem);
  @include position(fixed, -25rem null null -20rem, 0);
  opacity: 0.15;

  :deep(*) {
    fill: $purple;
  }
}

:deep(input) {
  @include blur;
  height: 3rem;
  font-size: 1rem;
  position: relative;
  margin-left: auto;
  line-height: 3rem;
  border-radius: 3rem;
  z-index: 10;

  &::placeholder {
    color: rgba($white, 0.5);
  }
}

.close {
  z-index: 100;
  position: relative;
}
</style>
