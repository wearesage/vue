<template>
  <div class="date">
    <p>{{ time }}</p>
    <small>{{ timeAgo }}</small>
  </div>
</template>

<script setup lang="ts">
const win = window as any;
const props = defineProps<{ value: any }>();
const time = formatTime(props.value)
const timeAgo = formatTimeAgo(props.value)
</script>

<style lang="scss" scoped>
.date {
  @include flex-column(end, end);
  white-space: nowrap;
}

* {
  font-family: monospace;
}

p {
  font-size: .9rem;
  margin-bottom: .15rem;
}

small {
  font-size: .8em;
  color: var(--gray);
}
</style>