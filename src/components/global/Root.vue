<template>
  <RouterView v-slot="{ Component, route }">
    <transition :name="`view`">
      <KeepAlive>
        <component :is="Component" :key="route" />
      </KeepAlive>
    </transition>
  </RouterView>
</template>
