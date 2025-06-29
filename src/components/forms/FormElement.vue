<template>
  <Row ref="el" class="form-element" :class="{ disabled: disabled === true }">
    <slot name="label">
      <label v-if="label" :class="{ hidden: hideLabel }">{{ label }}</label>
    </slot>
    <slot />
  </Row>
</template>

<script setup lang="ts">
import { ref, computed, defineExpose } from "vue";
import Row from "../layout/Row.vue";

const el = ref<any>();
const element = computed(() => el.value?.element?.value);

defineProps<{ label?: string; disabled?: boolean; hideLabel?: boolean }>();
defineExpose({ element });
</script>

<style lang="scss" scoped>
.form-element {
  @include flex-row(center, center);
  @include box(0 0.3 0 0.6, 0.75);
  padding: 3px 3px 3px 10px;
  position: relative;
  height: fit-content;
  background: $black;
  border-radius: 1.5rem;
  box-shadow: inset 0 0 2px 0 $black;
  transition: var(--transition);
}

.disabled :deep(> *) {
  pointer-events: none;
  opacity: 0.5;
}

label {
  transition: var(--transition);

  &.hidden {
    opacity: 0;
  }
}
</style>
