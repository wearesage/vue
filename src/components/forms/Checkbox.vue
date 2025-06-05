<template>
  <label class="checkbox">
    <span v-if="label">{{ label }}</span>

    <div class="container">
      <Input type="checkbox" :checked="modelValue" @input="onInput">
        <i>
          <Check width="2rem" height="2rem" />
        </i>
      </Input>
    </div>
  </label>
</template>

<script setup lang="ts">
import { Check } from "@iconoir/vue";
import Input from "../forms/Input.vue";

defineProps<{
  modelValue: any;
  label?: string;
}>();

const $emit = defineEmits(["update:model-value", "input"]);

function onInput(e) {
  $emit("update:model-value", e.target.checked);
  $emit("input", e.target.checked);
}
</script>

<style lang="scss" scoped>
label.checkbox {
  @include flex-row(space-between, center);
  @include box(0, 1);
  width: 100%;
  font-family: var(--heading-font-family);
  font-weight: var(--heading-font-weight);
  font-style: var(--heading-font-style);
  text-transform: lowercase;
  white-space: nowrap;
}

.container {
  @include flex;
  @include size(3rem);
  position: relative;

  :deep(.input) {
    padding: 0 !important;
    gap: 0 !important;
  }

  :deep(input) {
  }

  i {
    @include size(3rem);
    @include flex;
    position: absolute;
    transition: var(--transition);
    border-radius: 100%;
    border: 1px solid var(--light-gray);

    svg {
      @include size(2rem);
      opacity: 0;
      transition: var(--transition);
    }
  }

  :deep(input) {
    @include position(absolute, 0 0 0 0, 10);
    opacity: 0;

    &:checked + i svg {
      opacity: 1;
    }
  }
}
</style>
