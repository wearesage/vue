<template>
  <Column is="aside" cascade v-if="uniforms" :class="{ shifted }" :padding="1" :gap="0.5">
    <Row :gap="0.5">
      <IconButton class="code" icon="code" @click="visualizer.toggleEditor" :active="visualizer.showEditor" />
      <IconButton class="close" icon="close" @click="close" background="var(--pink)" />
    </Row>
    <div v-for="(_, key) in uniforms" class="uniform" :key="`uniform-${key}`">
      <span>{{ key }}</span>
      <template v-if="typeof uniforms[key].value === 'number' && typeof ranges[key]?.min === 'number'">
        <input type="range" :value="uniforms[key].value" :min="ranges[key]?.min" :max="ranges[key]?.max" :step="0.001" @input="(e: any) => onInput(key, e.target.value)" />
        <NumberFlow :step="0.001" :value="_.value" @input="onInput" class="flow" />
      </template>
      <template v-if="typeof uniforms[key].value === 'boolean'">
        <Toggle :model-value="uniforms[key].value" @update:model-value="e => onInput(key, e)" />
      </template>
      <template v-if="Array.isArray(uniforms[key].value) && uniforms[key].value?.length === 3">
        <input type="color" :value="glslColorToHex(uniforms[key].value)" @input="(e: any) => onColorInput(key, e.target.value)" />
      </template>
    </div>
  </Column>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import NumberFlow from "@number-flow/vue";
import { glslColorToHex, hexToGlslColor } from "../../util/colors";
import { useVisualizer } from "../../stores/visualizer";
import Column from "../layout/Column.vue";
import Row from "../layout/Row.vue";
import IconButton from "../common/IconButton.vue";
import Toggle from "../forms/Toggle.vue";
const props = defineProps<{
  uniforms: any;
  shifted?: boolean;
}>();

const ranges = ref<any>({});

const visualizer = useVisualizer();

function close() {
  visualizer.showUniforms = false;
}

function setRanges() {
  const uniforms: any = props.uniforms;

  if (!uniforms) return;

  ranges.value = Object.keys(uniforms).reduce((acc: any, key: string) => {
    const value = uniforms[key].value;

    acc[key] = {
      min: value - value / 1.01,
      max: value === 0 ? 0.5 : value + value / 1.01
    };

    return acc;
  }, {});
}

function onInput(key: any, e: any) {
  if (!props.uniforms) return;
  (props.uniforms as any)[key].value = typeof e === "boolean" ? e : Number(e);
}

function onColorInput(key: any, e: any) {
  (props.uniforms as any)[key].value = hexToGlslColor(e);
}

watch(
  () => props.uniforms,
  () => setRanges()
);

onMounted(() => setRanges());
</script>

<style lang="scss" scoped>
aside {
  @include position(fixed, 0 0 0 null, 30);
  @include hide-scroll-bar;
  align-items: end !important;
  overflow-y: scroll;
}

.uniform {
  @include flex-row(center, center);
  @include box(0.9 1, 0.75);
  line-height: 1rem;
  font-size: 0.8rem;
  position: relative;
  width: fit-content;
  background: rgba($black, 1);
  border-radius: 2rem;
}

aside > * {
  @include cascade(50);
}

@include range;

input[type="color"] {
  @include size(3rem, 1.75rem);
  border-radius: 1rem;
}

.shifted {
  transform: translateX(50vw);
}

.flow {
  min-width: 50px;
}
</style>
