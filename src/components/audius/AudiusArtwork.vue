<template>
  <figure v-if="item">
    <img :src="item?.artwork?.['480x480']" />
    <p>{{ item?.title || item?.playlist_name }}</p>
    <strong>{{ item?.user?.handle }}</strong>
  </figure>
</template>

<script setup lang="ts">
const { size = '240px' } = defineProps<{
  size?: string,
  item: {
    title: string;
    playlist_name: string;
    user: {
      handle: string;
    };
    artwork: {
      "480x480": string;
    };
  };
}>();
</script>

<style lang="scss" scoped>
figure {
  width: v-bind(size);
  height: fit-content;
  flex-shrink: 0;
}

img {
  @include size(100%, auto);
  border-radius: 1rem;
}

strong {
  font-weight: 900;
  font-family: "Major Mono Display";
}

p,
strong {
  font-size: 1rem;
  line-height: 1.25;
  display: block;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

strong {
  font-size: 0.75rem;
  opacity: 0.5;
}
</style>
