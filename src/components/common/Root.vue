<template>
  <transition :name="`view`">
    <SageRouterView v-if="!auth.loading" :key="route.path">
      <template #loading>
        <Loading />
      </template>
      <template #not-found>
        <Row :padding="1" :gap="1" align="center" justify="center" cascade>
          <h1>404</h1>
          <h2>Page Not Found</h2>
        </Row>
      </template>
    </SageRouterView>
  </transition>

  <transition :name="'view'">
    <Loading v-if="auth.loading" />
  </transition>
</template>

<script setup lang="ts">
import { watch } from "vue";
import { SageRouterView, useRoute, useRouter } from "../../router";
import { useAuth } from "../../stores";
import Loading from "./Loading.vue";
import Row from "../layout/Row.vue";

const auth = useAuth();
const route = useRoute();
const router = useRouter();

// Watch auth state and route changes with immediate execution
watch(
  [() => auth.isAuthenticated, () => route.value],
  ([authenticated, currentRoute]) => {
    if (authenticated && currentRoute.meta?.redirectWhenAuthenticated) {
      console.log("🎉 Authenticated user on redirect page - redirecting to", currentRoute.meta.redirectWhenAuthenticated);
      router.replace(currentRoute.meta.redirectWhenAuthenticated);
    } else if (currentRoute.meta?.requiresAuth && !authenticated) {
      console.log("🚫 Auth required but not authenticated - redirecting to homepage");
      router.replace("/");
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.not-found {
  padding: 2rem;
  text-align: center;
}

.not-found button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
