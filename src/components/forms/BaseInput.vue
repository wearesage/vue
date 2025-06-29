<template>
  <FormElement :label="label" :disabled="disabled">
    <slot name="left" />
    <input
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
import { onMounted, ref } from "vue";
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
    modelValue: string | number;
    disabled?: boolean;
    placeholder?: string;
    autofocus?: boolean;
    min?: string | number;
    max?: string | number;
    step?: string | number;
  }>(),
  {
    type: "text",
    disabled: false,
    autofocus: false,
    modelValue: ""
  }
);

const input = ref<HTMLInputElement>();

function onInput(e: Event) {
  const target = e.target as HTMLInputElement;
  console.log("Input value:", target.value, "Type:", props.type);
  const value = props.type === "number" ? Number(target.value) : target.value;
  emit("update:model-value", value);
}

onMounted(() => {
  if (props.autofocus) {
    input.value?.focus();
  }
});
</script>

<style lang="scss" scoped>
input {
  height: 1.75rem;
}
</style>
