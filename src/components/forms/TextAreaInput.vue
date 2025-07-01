<template>
  <FormElement :label="label" :disabled="disabled">
    <slot name="left" />
    <textarea
      ref="input"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :min="min"
      :max="max"
      :step="step"
      @input="onInput"
      @keypress="$emit('keypress', $event)"
      @keydown="$emit('keydown', $event)" />
    <slot name="right" />
  </FormElement>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, nextTick } from "vue";
import FormElement from "./FormElement.vue";
import type { InputType } from "../../types/form";

const emit = defineEmits<{
  "update:model-value": [value: string | number];
  keypress: [event: KeyboardEvent];
  keydown: [event: KeyboardEvent];
}>();

const props = withDefaults(
  defineProps<{
    type?: InputType;
    label?: string;
    modelValue: string;
    disabled?: boolean;
    placeholder?: string;
    autofocus?: boolean;
    autoWidth?: boolean;
    min?: string | number;
    max?: string | number;
    step?: string | number;
  }>(),
  {
    type: "text",
    disabled: false,
    autofocus: false,
    autoWidth: false
  }
);

const input = ref<HTMLInputElement>();

function onInput(e: Event) {
  const target = e.target as HTMLInputElement;
  const value = props.type === "number" ? Number(target.value) : target.value;
  emit("update:model-value", value);

  if (props.autoWidth) {
    updateWidth();
  }
}

async function updateWidth() {
  if (!input.value || !props.autoWidth) return;
  await nextTick();
  input.value.style.maxWidth = `${props.modelValue.length * 25}px`;
}

onMounted(() => {
  if (props.autofocus) {
    input.value?.focus();
  }

  if (props.autoWidth) {
    updateWidth();
  }
});

// Watch for modelValue changes to update width
watch(
  () => props.modelValue,
  () => {
    if (props.autoWidth) {
      updateWidth();
    }
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
textarea {
  // Width is handled by JavaScript when autoWidth is true
  transition: width 0.1s $transition-easing;
}
</style>
