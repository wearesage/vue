<template>
  <Row is="nav" class="socials">
    <a v-if="value.phone" class="phone">
      <Icon name="Phone" />
    </a>

    <a v-if="value.email" class="email">
      <Icon name="Email" />
    </a>

    <a v-if="value.website" class="website">
      <Icon name="Link" />
    </a>

    <a v-if="value.linkedin" class="linkedin">
      <Icon name="Linkedin" />
    </a>

    <a v-if="value.facebook" class="facebook">
      <Icon name="Facebook" />
    </a>

    <a v-if="value.instagram" class="instagram">
      <Icon name="Instagram" />
    </a>
  </Row>
</template>

<script setup lang="ts">
type Social = 'phone' | 'email' | 'website' | 'linkedin' | 'facebook' | 'instagram'

defineProps<{
  value: Record<Social, string>
}>()
</script>

<style lang="scss" scoped>
nav {
  @include flex-row(space-between);
  @include gap;
  width: 10rem;
}

nav :deep(svg) {
  @include size(1.5rem);
  opacity: .5;
  transition: var(--hover-transition);
}

a:hover :deep(svg) {
  opacity: 1;
}
</style>