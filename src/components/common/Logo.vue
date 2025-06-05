<template>
  <img class="logo color" src="/icon.png" />
  <img class="logo white" src="/icon.white.png" />
</template>

<script setup lang="ts">
const { size = "var(--element-size)" } = defineProps<{
  size?: string | number;
}>();
</script>

<style lang="scss" scoped>
img {
  display: block;
  border: 1px solid var(--dark);
  border-radius: 100%;
  padding: .25rem;
  width: v-bind(size);
  height: v-bind(size);

  .dark & {
    border: 1px solid var(--light);
  }
}

.color {
  display: block;

  .dark & {
    display: none;
  }
}


.white {
  display: none;

  .dark & {
    display: block;
  }
}
</style>
