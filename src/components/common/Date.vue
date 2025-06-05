<template>
  <div class="date">
    <p>{{ time }}</p>
    <small>{{ timeAgo }}</small>
  </div>
</template>

<script setup lang="ts">
import { formatTime, formatTimeAgo } from "../../util/time";

const props = defineProps<{ value: any }>();
const time = formatTime(props.value);
const timeAgo = formatTimeAgo(props.value);
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
  font-size: 0.9rem;
  margin-bottom: 0.15rem;
}

small {
  font-size: 0.8em;
  color: var(--gray);
}
</style>
