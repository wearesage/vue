<template>
  <RouterLink :to="`/businesses/${value._id}`" class="company-pill" v-if="value" @click="$emit('click')">
    <p class="name" v-if="value.name">{{ value.name }}</p>
  </RouterLink>
</template>

<script setup lang="ts">
defineProps<{
  value?: any
}>();
</script>

<style lang="scss">
.company-pill {
  @include flex-row(start);
  @include gap;

  * {
    line-height: var(--element-size);
  }

  &:hover {
    border-bottom: 1px solid var(--primary-color);
  }
}

.name {
  white-space: nowrap;
  font-weight: bold;
  border-bottom: 1px solid transparent;
  transition: var(--hover-transition);
}

a {
  transition: var(--hover-transition);

  &::first-letter {
    font-weight: 900;
  }

  &:hover {
    &::first-letter {
      font-weight: 900;
    }

    .name {
      border-bottom: 1px solid var(--white);
    }
  }
}

.role {
  border: 0 !important;
}
</style>
