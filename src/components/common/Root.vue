<template>
  <transition :name="`view`">
    <SageRouterView :key="route.path">
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
import Loading from "./Loading.vue";
import View from "../layout/View.vue";
import Row from "../layout/Row.vue";

const route = useRoute();
const router = useRouter();
</script>
>
