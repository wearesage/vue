<template>
  <!-- <RouterView v-slot="{ Component, route }">
    <transition :name="`view`">
      <KeepAlive>
        <component :is="Component" :key="route" />
      </KeepAlive>
    </transition>
  </RouterView> -->

  <RouterView />
</template>

<script setup lang="ts">
// import { KeepAlive } from "vue";
import { RouterView } from "vue-router";
</script>
