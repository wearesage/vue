<template>
  <transition :name="`view`">
    <Loading v-if="auth.loading || auth.isWalletInitializing" />
  </transition>

  <transition :name="`view`">
    <SageRouterView :key="route.path" v-if="!(auth.loading || auth.isWalletInitializing)">
      <template #not-found>
        <View :padding="1" :gap="1" center cascade>
          <Row>
            <h1>404</h1>
            <h2>Page Not Found</h2>
          </Row>
        </View>
      </template>
    </SageRouterView>
  </transition>
</template>

<script setup lang="ts">
import { watch } from "vue";
import { SageRouterView, useRoute, useRouter } from "../../router";
import { useAuth } from "../../stores";
import Loading from "./Loading.vue";
import View from "../layout/View.vue";
import Row from "../layout/Row.vue";

const auth = useAuth();
const route = useRoute();
const router = useRouter();

// Watch auth state and route changes with immediate execution
watch(
  [() => auth.isAuthenticated, () => route.value, () => auth.user],
  ([authenticated, currentRoute, user]) => {
    if (authenticated && currentRoute.meta?.redirectWhenAuthenticated) {
      // console.log("🎉 Authenticated user on redirect page - redirecting to", currentRoute.meta.redirectWhenAuthenticated);
      // router.replace(currentRoute.meta.redirectWhenAuthenticated);
      return;
    }

    // Basic auth check
    if (currentRoute.meta?.requiresAuth && !authenticated) {
      // console.log("🚫 Auth required but not authenticated - redirecting to homepage");
      // router.replace("/");
      return;
    }

    // Role-based access checks (only if authenticated)
    if (authenticated && user) {
      // Admin access required
      if (currentRoute.meta?.requiresAdmin && !auth.isAdmin) {
        console.log("🚫 Admin access required - redirecting to homepage");
        router.replace("/");
        return;
      }

      // Artist access required
      if (currentRoute.meta?.requiresArtist && !auth.isArtist) {
        console.log("🚫 Artist access required - redirecting to homepage");
        router.replace("/");
        return;
      }

      // Subscriber access required
      if (currentRoute.meta?.requiresSubscriber && !auth.isSubscriber) {
        console.log("🚫 Subscriber access required - redirecting to homepage");
        router.replace("/");
        return;
      }

      // Paid tier access required (subscriber, artist, or admin)
      if (currentRoute.meta?.requiresPaidTier && !auth.isPaidTier) {
        console.log("🚫 Paid tier access required - redirecting to homepage");
        router.replace("/");
        return;
      }

      // Artist or Admin access required
      if (currentRoute.meta?.requiresArtistOrAdmin && !auth.isArtistOrAdmin) {
        console.log("🚫 Artist or Admin access required - redirecting to homepage");
        router.replace("/");
        return;
      }
    }
  },
  { immediate: true }
);
</script>
