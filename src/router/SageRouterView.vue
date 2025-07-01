<template>
  <component v-if="currentComponent && !loading" :is="currentComponent" :key="route.path" />
  <div v-else-if="loading" class="sage-router-loading">
    <slot name="loading">
      <p>Loading...</p>
    </slot>
  </div>
  <div v-else class="sage-router-not-found">
    <slot name="not-found">
      <h1>404 - Page Not Found</h1>
      <p>Route: {{ route.path }}</p>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, shallowRef } from "vue";
import { useRoute } from "./sage-router";

const route = useRoute();
const currentComponent = shallowRef<any>(null);
const loading = ref(false);

// Watch route changes and load components
watch(
  () => route.value.matched,
  async matched => {
    if (!matched) {
      currentComponent.value = null;
      return;
    }

    try {
      loading.value = true;
      console.log("🔄 Loading component for route:", route.value.path);

      // Dynamic import the component
      const componentModule = await matched.component();
      currentComponent.value = componentModule?.default || componentModule;
      console.log("✅ Component loaded:", route.value.path);
    } catch (error) {
      console.error("💥 Failed to load component:", error);
      currentComponent.value = null;
    } finally {
      loading.value = false;
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.sage-router-loading,
.sage-router-not-found {
  padding: 2rem;
  text-align: center;
}

.sage-router-not-found {
  color: #ef4444;
}
</style>
