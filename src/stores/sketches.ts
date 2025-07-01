import { ref, shallowRef, computed, watch } from "vue";
import { defineStore, acceptHMRUpdate } from "pinia";
import { useRAF } from "./raf";
import type { Sketch, Variant, AddUniformProps } from "../types/sketches";
import { useStudies } from "../composables";
import { buildVariantInterpolator, clone, sample, addUniformToSketch, patchUniformValueWithName, generateVariant } from "../util";

type SelectionMethod = "pointer" | "keyboard" | "internal";

const PUBLISHED_STUDY = "66f2980c92cc9d303e380427";

export const useSketches = defineStore("sketches", () => {
  const raf = useRAF();
  const sketch = shallowRef<Sketch | null>(null);
  const activeSketchId = computed(() => sketch.value?._id || null);
  const activeStudyId = ref(PUBLISHED_STUDY);
  const { iterations, index } = useStudies(activeStudyId, activeSketchId);
  const shader = ref();
  const uniforms = ref<Variant>({});
  const variant = ref(0);
  const shuffleVariants = ref(false);
  const variantShuffleInterval = ref<any>(null);
  const keyboardIndex = ref(0);
  const sketchSelectionMethod = ref<SelectionMethod>("pointer");
  const tweening = ref(false);
  const shaderError = ref<any>(null);
  const magicInterval = ref<any>(null);
  const uniformKeys = computed(() => Object.keys(uniforms.value || {})); // ['zoom', 'rotation', 'invert']
  const uniformKeysSerialized = computed(() => uniformKeys.value.join(",")); // 'zoom,rotation,true'
  const uniformValues = computed(() => uniformKeys.value.map((v: string) => (uniforms.value as any)?.[v]?.value)); // [1.231, 12.212, true]
  const uniformValuesSerialized = computed(() => uniformValues.value.join(",")); // '1.231,12.212,true'
  const activeVariant = computed(() => clone(sketch?.value?.variants?.[variant.value] || {}));
  const activeVariantKeys = computed(() => Object.keys(activeVariant.value)); // ['zoom', 'rotation', 'invert']
  const activeVariantKeysSerialized = computed(() => activeVariantKeys.value.join(",")); //  'zoom,rotation,true'
  const activeVariantValues = computed(() => activeVariantKeys.value.map((v) => activeVariant.value[v]?.value)); // [1.231, 12.212, true]
  const activeVariantValuesSerialized = computed(() => activeVariantValues.value.join(",")); // '1.231,12.212,true'
  const uniformKeysDirty = computed(() => uniformKeysSerialized.value !== activeVariantKeysSerialized.value);
  const uniformValuesDirty = computed(() => uniformValuesSerialized.value !== activeVariantValuesSerialized.value);
  const uniformsDirty = computed(() => uniformKeysDirty.value || uniformValuesDirty.value);
  const shaderDirty = computed(() => shader.value !== sketch.value?.shader);
  const isDirty = computed(() => uniformsDirty.value || shaderDirty.value);
  const canAddVariant = computed(() => !tweening.value && uniformValuesDirty.value);

  watch(
    () => shuffleVariants.value,
    (val) => {
      clearInterval(variantShuffleInterval.value);
      if (!val) return;
      variantShuffleInterval.value = setInterval(selectNextVariant, 3050);
    },
    {
      immediate: true,
    }
  );

  function selectSketch(value: Sketch, method: SelectionMethod = "pointer", internal: any = null) {
    const currentId = sketch.value?._id;

    raf.remove("variant");

    sketchSelectionMethod.value = method;
    tweening.value = false;
    sketch.value = clone(value);
    shader.value = value.shader;

    if (currentId !== value._id && internal === null) {
      variant.value = 0;
      keyboardIndex.value = 0;
    } else {
      variant.value = value.variants.length - 1;
    }

    uniforms.value = clone(value.variants[variant.value]);
  }

  function selectVariant(i: number) {
    if (!sketch.value) return;
    variant.value = i;
    tweenTo(sketch.value.variants[i]);
  }

  function tweenVariant(from: Variant, to: Variant, duration = shuffleVariants.value ? 2500 : 1000) {
    const iVariant = buildVariantInterpolator(clone(from), clone(to));

    tweening.value = true;

    raf.add(
      (now, progress) => {
        const next = iVariant(progress);
        uniformKeys.value.forEach((key) => {
          uniforms.value[key].value = next[key].value;
        });

        if (progress === 1) tweening.value = false;
      },
      {
        duration,
        id: "variant",
      }
    );
  }

  function tweenTo(values: Variant, duration = shuffleVariants.value ? 2500 : 1000) {
    tweenVariant(uniforms.value, values, duration);
  }

  function sampleSketches() {
    selectSketch(sample(iterations.value) as any);
  }

  function selectSketchByIndex(i: number, method: SelectionMethod = "pointer") {
    selectSketch(iterations.value[i], method);
  }

  function selectPreviousSketch(method: SelectionMethod = "pointer") {
    const last = iterations.value.length - 1;
    const target = index.value - 1;
    if (target === -1) return selectSketchByIndex(last, method);
    selectSketchByIndex(target, method);
  }

  function selectNextSketch(method: SelectionMethod = "pointer") {
    const last = iterations.value.length - 1;
    const target = index.value + 1;
    if (target > last) return selectSketchByIndex(0, method);
    selectSketchByIndex(target, method);
  }

  function addUniform(e: AddUniformProps) {
    if (!sketch.value) return;
    const cloned = addUniformToSketch(sketch, e) as Sketch;
    cloned.shader = patchUniformValueWithName(shader, e);
    selectSketch(cloned, "internal");
  }

  function addVariant() {
    if (!sketch.value) return;
    const cloned = clone(sketch.value);
    cloned.variants.push(clone(uniforms.value));
    selectSketch(cloned, "internal");
  }

  function selectNextVariant() {
    if (!sketch.value) return;
    const len = sketch.value?.variants.length;
    if (variant.value + 1 === len) return selectVariant(0);
    selectVariant(variant.value + 1);
  }

  function toggleShuffleVariants() {
    shuffleVariants.value = !shuffleVariants.value;
  }

  function magicTween(duration = 500, temp = 0.7) {
    if (!sketch.value) return;
    const source = sketch.value.variants[variant.value];
    tweenTo(generateVariant(source, temp), duration);
  }

  function startMagicInterval() {
    clearInterval(magicInterval.value);
    magicInterval.value = setInterval(() => {
      magicTween(3000, 0.25);
    }, 3100);
  }

  function stopMagicInterval() {
    clearInterval(magicInterval.value);
  }

  /**
   * Reset sketches store state (called on logout)
   */
  function reset() {
    console.log('🎨 Resetting sketches store state');
    
    // Stop all intervals
    clearInterval(variantShuffleInterval.value);
    clearInterval(magicInterval.value);
    
    // Reset interval refs
    variantShuffleInterval.value = null;
    magicInterval.value = null;
  }

  return {
    sampleSketches,
    variant,
    sketch,
    activeSketchId,
    shader,
    uniforms,
    shuffleVariants,
    index,
    selectSketchByIndex,
    selectPreviousSketch,
    selectNextSketch,
    selectVariant,
    tweening,
    toggleShuffleVariants,
    sketchSelectionMethod,
    addVariant,
    addUniform,
    uniformValues,
    shaderDirty,
    isDirty,
    uniformKeys,
    uniformKeysSerialized,
    uniformValuesSerialized,
    uniformValuesDirty,
    activeVariantKeys,
    activeVariantKeysSerialized,
    activeVariantValues,
    activeVariantValuesSerialized,
    keyboardIndex,
    selectSketch,
    iterations,
    shaderError,
    magicTween,
    tweenTo,
    activeVariant,
    startMagicInterval,
    stopMagicInterval,
    canAddVariant,
    reset,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSketches, import.meta.hot));
}
