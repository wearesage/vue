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
  @include shadow;
  @include box(0.25, 0.125);
  position: relative;
  box-shadow: none;
  transition: var(--transition);
  border: 0;
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
