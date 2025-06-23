<template>
  <transition name="fade">
    <aside
      v-if="popover.visible"
      @click.stop
      :key="JSON.stringify([popover.uniformKey, popover.visible, popover.inputTextKey])"
      ref="element"
      class="popover"
      :style="{ transform: popover.transform }">
      <RangeInput
        v-if="isNumber"
        :label="popover.uniformKey"
        v-model="sketches.uniforms[popover.uniformKey].value"
        :min="min"
        :max="max"
        :step="step" />

      <Toggle
        :label="popover.uniformKey"
        v-else-if="isBool"
        v-model="sketches.uniforms[popover.uniformKey].value" />
      <Row
        center
        v-else-if="popover.inputTextKey">
        <TextInput
          @keypress="onKeyPress"
          v-model="popover.inputText"
          :autofocus="true"
          :placeholder="popover.inputTextKey" />
        <IconButton
          icon="save"
          @click="popover.acceptText()"
          :small="true" />
      </Row>
    </aside>
  </transition>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { onClickOutside } from "@vueuse/core";
import { usePopover, useToast } from "../../stores";
import TextInput from "../forms/TextInput.vue";
import IconButton from "./IconButton.vue";
import Row from "../layout/Row.vue";
import RangeInput from "../forms/RangeInput.vue";
import { useSketches } from "../../stores";
import { rangeUtils } from "../../util/uniforms";
import Toggle from "../forms/Toggle.vue";

const toast = useToast();
const sketches = useSketches();
const popover = usePopover();
const element = ref();
const min = ref<number | null>(null);
const max = ref<number | null>(null);
const step = ref<number | null>(null);
const isNumber = computed(
  () =>
    typeof min.value === "number" &&
    typeof max.value === "number" &&
    typeof step.value === "number" &&
    popover.uniformKey &&
    typeof sketches.uniforms[popover.uniformKey].value === "number"
);

const isBool = computed(() => popover.uniformKey && typeof sketches.uniforms[popover.uniformKey].value === "boolean");

watch(
  () => popover.uniformKey,
  key => {
    if (!key) return;
    min.value = rangeUtils.getMin(popover.uniformKey, sketches.uniforms[key].value);
    max.value = rangeUtils.getMax(popover.uniformKey, sketches.uniforms[key].value);
    step.value = rangeUtils.getStep(popover.uniformKey);
  },
  {
    immediate: true
  }
);

function onKeyPress(e: KeyboardEvent) {
  if (e.key === "Enter") {
    popover.acceptText();
  }
}

onClickOutside(element, () => {
  popover.visible = false;
});
</script>

<style lang="scss" scoped>
.popover {
  @include position(fixed, 0 null null 0, 100);
  border-radius: 1rem;
  transform-origin: center center;
}
</style>
