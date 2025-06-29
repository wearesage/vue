<template>
  <BaseInput
    type="number"
    :label="label"
    :model-value="modelValue"
    :disabled="disabled"
    :placeholder="placeholder"
    :autofocus="autofocus"
    :min="min"
    :max="max"
    :step="step"
    @update:model-value="$emit('update:model-value', $event)"
    @keypress="$emit('keypress', $event)"
    @keydown="$emit('keydown', $event)">
    <template #left>
      <slot name="left" />
    </template>
    <template #right>
      <slot name="right" />
    </template>
  </BaseInput>
</template>

<script setup lang="ts">
import BaseInput from "./BaseInput.vue";
import type { NumberInputProps } from "../../types/form";

const $emit = defineEmits<{
  "update:model-value": [value: any];
  keypress: [event: KeyboardEvent];
  keydown: [event: KeyboardEvent];
}>();

defineProps<NumberInputProps>();
</script>
