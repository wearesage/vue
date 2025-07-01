<template>
  <IconButton
    @click="$emit('click')"
    :class="{ [`source_${sources?.source}`]: sources?.source !== undefined }"
    :icon="sources.sourceIcon"
    :label="label" />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { IconButton, useSources, useUserState } from "@wearesage/vue";

defineEmits(["click"]);

const userState = useUserState();
const sources = useSources();
const showLabels = computed(() => userState.showMenuLabels);
const label = computed(() => (showLabels.value ? sources.prettySource ?? "Audio Source" : null));
</script>

<style lang="scss" scoped>
@each $source, $color in $source-colors {
  .source_#{$source} {
    border-width: 2px;
    border-color: $color !important;
    color: $color;

    &:hover {
      color: $color;
    }
  }
}
</style>
