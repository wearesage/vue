<template>
  <FormElement :label="label" :disabled="disabled">
    <select @change="onInput" :value="modelValue">
      <option value="">Select Columns</option>
      <option
        v-for="(opt, i) in options"
        :value="opt?.value || opt"
        :key="`${opt?.label || opt}-${i}`"
        :selected="(opt?.value || opt) === modelValue">
        {{ opt?.label || opt }}
      </option>
    </select>
  </FormElement>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";

import FormElement from "./FormElement.vue";
import type { SelectProps } from "../../types/form";

const emit = defineEmits<{
  "update:model-value": [value: string];
  keypress: [event: KeyboardEvent];
  keydown: [event: KeyboardEvent];
}>();

const props = defineProps<SelectProps>();

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
select {
  @include form-input;
  padding-right: 2rem;
  cursor: pointer;
  appearance: none;
}
</style>
