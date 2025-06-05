<template>
  <RouterLink :to="`/users/${value._id}`" class="identity-pill" v-if="value" @click="$emit('click')" :is="is"
    :class="{ [value?.role]: value?.role }">
    <!-- <Avatar v-if="value?.name?.full" :src="`https://api.dicebear.com/9.x/pixel-art/svg?seed=${value.name.full}`" -->
    <!-- size="2rem" /> -->
    <p class="name" v-if="value.name">{{ value.name?.full || value.name }}</p>
  </RouterLink>
</template>

<script setup lang="ts">
const { value, is = "p" } = defineProps<{ value: any; is?: string }>();
const $emit = defineEmits(['click'])
</script>


<style lang="scss" scoped>
.identity-pill {
  @include flex-row(start);
  @include gap;
  flex: 1;
  width: 100%;
}

.name {
  white-space: nowrap;
  font-weight: bold;
  transition: var(--hover-transition);
}

.role {
  border: 0 !important;
}
</style>