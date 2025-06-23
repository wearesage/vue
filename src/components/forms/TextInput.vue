<template>
  <FormElement
    :label="label"
    :disabled="disabled">
    <input
      type="text"
      ref="input"
      :value="modelValue"
      :placeholder="placeholder"
      @keypress="e => $emit('keypress', e)"
      @keydown="e => $emit('keydown', e)"
      @input="(e: any) => onInput(e)"
      :disabled="disabled" />
  </FormElement>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";

import FormElement from "./FormElement.vue";

const emit = defineEmits(["update:model-value", "keypress", "keydown"]);

const props = defineProps<{
  label?: string;
  modelValue: string;
  disabled?: boolean;
  placeholder?: string;
  autofocus?: boolean;
}>();

function onInput(e: any) {
  emit("update:model-value", e.target.value);
}

const input = ref();

onMounted(() => {
  if (props.autofocus) {
    input?.value?.focus?.();
  }
});
</script>

<style lang="scss" scoped>
input[type="text"] {
  width: 10rem;
  height: 1.5rem;
}
</style>
