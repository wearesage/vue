<template>
  <div class="role-pill" v-if="user" @click="$emit('click')" :is="is" :class="{ [user.role]: user.role }">
    <p class="business" v-if="user.business && user.business?.name">{{ toLabel(user.title) }} {{ `@
      ${user.business?.name}` }}</p>
  </div>
</template>

<script setup lang="ts">
const toLabel = snakeToLabel
const { user, is = "p" } = defineProps<{ user: User; is?: string }>();
const $emit = defineEmits(['click'])
</script>


<style lang="scss" scoped>
.role-pill {
  @include flex-row(start);
  @include gap(.5);
  flex: 1;


  * {
    line-height: 1
  }
}

span {
  font-size: .7rem;
}
</style>