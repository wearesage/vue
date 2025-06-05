<template>
  <Column v-if="user" class="user-info" cascade>
    <img :src="user.profile_picture['1000x1000']" />
    <div class="info">
      <h1>{{ user.handle }}</h1>
      <p>{{ user.bio }}</p>
      <AudiusUserSocials :user="user" />
    </div>
  </Column>
</template>

<script lang="ts" setup>
defineProps<{ user: any }>();
</script>

<style lang="scss" scoped>
$size: 60vh;

.user-info {
  position: relative;

  &:before {
    pointer-events: none;
  }
}

img {
  @include size($size);
}

img {
  @include padding(0 0.5 0.5 0);
  border-bottom-right-radius: 100%;
  border-bottom: 0.25rem dotted $purple;
  border-right: 0.25rem dotted $purple;
}

.info {
  @include flex-column(start, start);
  @include box;
  @include size($size, auto);
  z-index: 100;
}

h1 {
  @include text-gradient($pink, $purple);
  max-width: $size;
  text-overflow: ellipsis;
  overflow: hidden;
  font-size: 5rem;
  line-height: 1;
}
</style>
