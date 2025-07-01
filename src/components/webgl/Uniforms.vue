<template>
  <Column v-if="sketches.uniforms" justify="end" align="end">
    <Row v-for="(_, key) in sketches.uniforms" class="uniform" :class="getClasses(key)" cascade>
      <ColorInput v-if="isColor(_.value)" :label="key" :webgl="true" v-model="(_.value as [number, number, number])" />
      <Toggle v-if="isBoolean(_.value)" :label="key" v-model="_.value" />
      <RangeInput
        v-if="typeof _.value === 'number'"
        @input="onFocus(key)"
        @blur="onBlur"
        v-model="_.value"
        ref="range"
        :min="ranges?.[key]?.min"
        :max="ranges?.[key]?.max"
        :step="ranges?.[key]?.step"
        :label="key" />
    </Row>
  </Column>
</template>

<script setup lang="ts">
import { watch, shallowRef } from "vue";
import { Row, Column, useSketches, Toggle, RangeInput, ColorInput, uniformRangeUtils } from "@wearesage/vue";

const $emits = defineEmits(["focus", "blur"]);
const props = defineProps<{
  focused: boolean;
  focusedKey: string | null;
}>();

const sketches = useSketches();
const ranges = shallowRef<any>({});
const { getMin, getMax, getStep } = uniformRangeUtils;

watch(
  () => sketches.uniformKeysSerialized,
  () => {
    ranges.value = {};
    sketches.uniformKeys.forEach(key => {
      const val = sketches.uniforms[key].value;
      if (typeof val !== "number") return;
      ranges.value[key] = {
        min: getMin(key, val),
        max: getMax(key, val),
        step: getStep(key, val) || 0.00001
      };
    });
  },
  {
    immediate: true
  }
);

function getClasses(key: string) {
  return {
    active: key === sketches.uniformKeys?.[sketches.keyboardIndex],
    hidden: props.focused && props.focusedKey !== key,
    focused: props.focused && props.focusedKey === key
  };
}

function isColor(val: any) {
  if (Array.isArray(val) && val.length === 3) return true;
  if (val?.isColor) return true;
  return false;
}

function isBoolean(val: any) {
  return typeof val === "boolean";
}

function onFocus(key: string) {
  $emits("focus", key);
}

function onBlur() {
  $emits("blur");
}
</script>

<style lang="scss" scoped>
.uniform {
  transition: opacity $transition-duration $transition-easing;
}

.hidden {
  opacity: 0 !important;
}
</style>
