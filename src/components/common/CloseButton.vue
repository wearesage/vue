<template>
  <div class="close-button">
    <IconButton
      icon="close"
      @click="$emit('close')" />
  </div>
</template>

<script setup lang="ts">
import IconButton from "./IconButton.vue";

defineEmits(["close"]);
</script>
