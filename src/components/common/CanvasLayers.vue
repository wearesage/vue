<template>
  <section class="canvas-layers">
    <slot />
  </section>
</template>

<style lang="scss" scoped>
.canvas-layers {
  @include flex;
  position: relative;
}

:deep(canvas) {
  position: absolute;
}

:deep(canvas:last-of-type) {
  z-index: 10;
}
</style>
