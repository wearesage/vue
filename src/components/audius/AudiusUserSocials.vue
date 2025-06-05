<template>
  <Row class="audius-user-socials" is="nav" v-if="user" :gap="true">
    <a v-if="user.website" :href="website" target="_blank">
      <Icon icon="globe" />
    </a>

    <a v-if="user.twitter_handle" :href="`https://www.twitter.com/${user.twitter_handle}`" target="_blank">
      <Icon icon="twitter" />
    </a>

    <a v-if="user.instagram_handle" :href="`https://www.instagram.com/${user.instagram_handle}`" target="_blank">
      <Icon icon="instagram" />
    </a>

    <a v-if="user.tiktok_handle" :href="`https://www.tiktok.com/@${user.tiktok_handle}`" target="_blank">
      <Icon icon="tiktok" />
    </a>
  </Row>
</template>

<script setup lang="ts">
import Row from "../layout/Row.vue";
import Icon from "../common/Icon.vue";
import { useAudiusUserWebsite } from "../../composables/useAudiusUserWebsite";

const props = defineProps<{ user: any }>();
const website = useAudiusUserWebsite(props.user);
</script>

<style lang="scss" scoped>
svg {
  @include size(2rem);
  transition: var(--hover-transition);
}

a:hover svg {
  fill: var(--pink);
}
</style>
