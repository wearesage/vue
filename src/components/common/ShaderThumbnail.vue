<template>
  <img :src="src" />
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    id: string;
    size?: string;
  }>(),
  {
    size: "20vw"
  }
);

const bucket = import.meta.env.VITE_S3_BUCKET;
const src = computed(() => `${bucket}/thumbs/${props.id}.jpg?v=${0}`);
</script>

<style lang="scss" scoped>
img {
  width: v-bind(size);
  height: v-bind(size);
}
</style>
