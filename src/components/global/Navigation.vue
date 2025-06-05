<template>
  <nav
    :class="{ visible }"
    ref="el">
    <Logo size="2.5rem" />
    <Column class="links">
      <RouterLink :to="'/'">
        <Pill>Home</Pill>
      </RouterLink>
      <RouterLink :to="'/theme'">
        <Pill>Theme</Pill>
      </RouterLink>
    </Column>
  </nav>
</template>

<script setup lang="ts">
const container = useTemplateRef("el");
const width = ref(0);
const visible = ref(false);

useResizeObserver(container, entries => {
  const entry = entries[0];
  width.value = entry.borderBoxSize[0].inlineSize;
});

onBeforeUnmount(() => {
  document.body.classList.remove("shifted");
});
</script>

<style lang="scss" scoped>
nav {
  @include position(fixed, 0 null 0 0, 100);
  @include flex-column(start);
  @include size(var(--element-size), 100%);
  @include box(1, 0);
  transition: var(--transition);
  padding-bottom: 1rem;
  background: var(--light);

  .dark & {
    background: var(--black);
  }

  a {
    position: relative;
  }
}

.pill {
  @include position(absolute, 50% null null calc(100% + 1rem));
  @include box(0.5 0.75);
  transform: translateY(-50%) scale(0.85);
  transition: var(--hover-transition);
  background-color: var(--black);
  color: var(--light);
  opacity: 0;
  pointer-events: none;
}

a:hover .pill {
  opacity: 1;
  transform: translateY(-50%) scale(1);
}

.logo {
  display: flex;
  position: absolute;
  top: 0;
}

.links {
  @include box(2 0, 0);
  @include position(absolute, 50% null null null);
  transform: translateY(-50%);

  a {
    @include box;
  }
}

.router-link-exact-active :deep(svg) {
  color: var(--primary-color) !important;
}
</style>
