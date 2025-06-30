<template>
  <a
    v-if="href"
    :href="href"
    :target="href ? '_blank' : undefined"
    :rel="href ? 'noopener noreferrer' : undefined"
  >
    <slot />
  </a>
  <button
    v-else
    @click="handleClick"
    :class="{ active: isActive }"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter, useRoute } from "../../router/sage-router";

interface Props {
  to?: string;
  href?: string;
  replace?: boolean;
}

const props = defineProps<Props>();
const router = useRouter();
const route = useRoute();

// Check if the link is active (for internal links)
const isActive = computed(() => {
  if (!props.to) return false;
  return route.value.path === props.to;
});

function handleClick() {
  if (props.to) {
    if (props.replace) {
      router.replace(props.to);
    } else {
      router.push(props.to);
    }
  }
}
</script>

<style scoped>
button {
  background: none;
  border: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}

button:hover,
a:hover {
  opacity: 0.8;
}

button.active {
  font-weight: bold;
}

a {
  color: inherit;
  text-decoration: underline;
}
</style>