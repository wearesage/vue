<template>
  <fieldset>
    <label v-if="label">{{ label }}</label>
    <select @change="onChange" :value="value">
      <option value="">Select Columns</option>
      <option v-for="(opt, i) in options" :value="opt.value" :key="`${opt.text}-${i}`" :selected="opt.value === opt">
        {{ opt.text }}
      </option>
    </select>

    <Button>
      <Icon name="chevron-down" />
    </Button>
  </fieldset>
</template>

<script setup lang="ts">
import Button from "../common/Button.vue";
import Icon from "../common/Icon.vue";
import type { SelectOption } from "../../util/forms";

defineProps<{ options: SelectOption[]; value?: any; label?: string }>();

const $emit = defineEmits(["select"]);

function onChange(e: any) {
  $emit("select", e.target.value);
}
</script>

<style lang="scss" scoped>
fieldset {
  @include flex-row;
  @include gap(0.5);
  width: var(--text-input-width);
  position: relative;
}

label {
  font-size: 0.8rem;
  font-weight: 200;
  opacity: 0.5;
  text-transform: uppercase;
}

select {
  @include form-element;
  width: 100%;
  padding-right: 2rem;
}

button {
  @include position(absolute, 50% 1rem 0 null);
  @include flex;
  transform: translateY(-50%);
}
</style>
