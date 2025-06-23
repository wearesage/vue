<template>
  <FormElement
    :label="label"
    :disabled="disabled">
    <input
      type="range"
      :value="modelValue"
      :min="min"
      :max="max"
      :step="step"
      @input="(e: any) => onInput(e)"
      :disabled="disabled" />
    <div
      class="value"
      :style="style"
      ref="val">
      {{ Number(modelValue)?.toFixed?.(3) }}
    </div>
  </FormElement>
</template>

<script setup lang="ts">
import { ref } from "vue";
import FormElement from "./FormElement.vue";
import { usePaddedFitContent } from "../../composables";

const emit = defineEmits(["update:model-value"]);

defineProps<{
  label?: string;
  modelValue: number;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  showRanges?: boolean;
}>();

function onInput(e: any) {
  emit("update:model-value", parseFloat(e.target.value));
}

const val = ref();
const style = usePaddedFitContent(val);
</script>

<style lang="scss" scoped>
@include range;

input[type="range"] {
  @include size(auto, 1.75rem);
  padding-top: 0;
  padding-right: 0;

  width: 8rem;
  flex: 1;
  flex-shrink: 0;
}

.value {
  display: flex;
  align-items: end;
  justify-content: end;
  min-width: 4.5rem;
  margin-left: auto;
  text-align: right;
  padding-right: 0.5rem;
}
</style>
