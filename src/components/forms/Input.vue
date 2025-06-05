<template>
  <Column
    class="input container"
    :class="{ [type]: true }">
    <Row
      class="label-row"
      v-if="label || type === 'range'">
      <label v-if="label">{{ label }}</label>
      <Row
        class="number"
        v-if="type === 'range'">
        <span v-if="currency">$</span>
        <NumberFlow
          :min="min"
          :step="step"
          :max="max"
          :name="name"
          :value="model"
          @input="onInput" />
      </Row>
    </Row>
    <input
      ref="input"
      :data-name="name"
      :class="{ [type]: true, row }"
      @input="onInput"
      @keydown="onKeyDown"
      @focus="onFocus"
      @blur="onBlur"
      :type="type"
      :name="name"
      :value="type === 'radio' || type === 'checkbox' ? value : model"
      :autofocus="autofocus"
      :min="min"
      :step="step"
      :max="max"
      :placeholder="placeholder"
      :checked="checked" />
    <slot></slot>
  </Column>
</template>

<script setup lang="ts">
import NumberFlow from "@number-flow/vue";

const {
  type,
  name,
  placeholder,
  row,
  min,
  max,
  step,
  autofocus = undefined
} = defineProps<{
  type: FormInputType;
  name?: string;
  row?: boolean;
  placeholder?: string;
  autofocus?: boolean;
  selected?: any;
  checked?: any;
  value?: any;
  label?: string;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  currency?: boolean;
}>();

const input = ref();
const model = defineModel();
const emit = defineEmits(["input", "keydown"]);
const savedValue = ref<any>();

function onInput(e: any) {
  e.stopImmediatePropagation();
  const target = e.target as HTMLInputElement;
  model.value = type === "number" ? Number(target.value) : target.value;
  emit("input", model.value);
}

function onKeyDown(e: any) {
  emit("keydown", e);
}

function onFocus(e: any) {
  savedValue.value = e.target.value;
  e.preventDefault();
  e.stopImmediatePropagation();
  e.target.value = "";
}

function onBlur(e: any) {
  if (!e.target.value && savedValue.value) {
    e.target.value = savedValue.value;
  }
}

onMounted(async () => {
  if (!autofocus) return;
  await nextTick();
  input.value?.focus();
});
</script>

<style lang="scss" scoped>
.input {
  @include gap(0.5);
  flex: 1;
  width: 100%;
}

input {
  @include padding(0 1);
  width: 100%;
  height: var(--element-size);
  font-size: 1rem;

  &[type="range"] {
    padding: 0;
  }

  &[type="color"] {
    @include size(var(--element-size));
    padding: 0;
  }
}

.label-row {
  @include flex-row(space-between);
  width: 100%;
}

label {
  font-family: var(--heading-font-family);
  font-weight: var(--heading-font-weight);
  font-style: var(--heading-font-style);
  text-transform: lowercase;
  white-space: nowrap;
}

.number {
  font-size: 1rem;
  text-align: center;
  margin: 0 auto;
  width: 100%;
  font-family: var(--heading-font-family);
  font-weight: var(--heading-font-weight);
  font-style: var(--heading-font-style);
  align-items: center;
  justify-content: end;
  margin-left: auto;
}

@include range;

input[type="range"] {
  margin-top: 1rem;
}

.input.number {
  height: 3rem !important;
  margin-bottom: auto;
}
</style>
