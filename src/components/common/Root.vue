<template>
  <RouterView v-slot="{ Component, route }">
    <transition :name="`view`">
      <component v-if="!auth.loading" :is="Component" :key="route" />
    </transition>

    <transition :name="'view'">
      <Loading v-if="auth.loading" />
    </transition>
  </RouterView>
</template>

<script setup lang="ts">
import { RouterView } from "vue-router";
import { useAuth } from "../../stores";
import Loading from "./Loading.vue";

const auth = useAuth();
</script>
