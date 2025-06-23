import { ref, shallowRef, markRaw, computed, Ref } from "vue";
import { defineStore } from "pinia";
import { useRAF } from "./raf";
import { buildVariantInterpolator, clone, sample } from "../util";
import { transformLegacySketch, isValidSketch, cleanStudyIterations, type LegacySketch } from "../util/transformLegacySketch";
import legacyData from "../data/shaders/old.json";
import studyData from "../data/shaders/studies.json";
import type { Sketch, Variant, AddUniformProps } from "../types/sketches";
import { addUniformToSketch, patchUniformValueWithName } from "../util";

const data = (legacyData as LegacySketch[]).filter(isValidSketch).map(transformLegacySketch);
const validSketchIds = new Set(data.map((sketch) => sketch._id));
const cleanedStudyData = cleanStudyIterations(studyData, validSketchIds);

const STUDY_MAP = cleanedStudyData.reduce((acc: any, study: any, i: number) => {
  acc[study._id] = i;
  return acc;
}, {});

const ITERATION_MAP = data.reduce((acc: any, iteration: any, i: number) => {
  acc[iteration._id] = i;
  return acc;
}, {});

const _published = markRaw(cleanedStudyData[STUDY_MAP["66f2980c92cc9d303e380427"]].iterations.map((id: any) => data[ITERATION_MAP[id]]));

type SelectionMethod = "pointer" | "keyboard" | "internal";

export const useSketches = defineStore("sketches", () => {
  const raf = useRAF();
  const iterations = shallowRef<any>(data);
  const studies = shallowRef<any>(cleanedStudyData);
  const published = shallowRef<Sketch[]>(clone(_published));
  const pubLen = shallowRef(published.value.length);
  const variant = ref(0);
  const shuffleVariants = ref(false);
  const sketchSelectionMethod = ref<SelectionMethod>("pointer");
  const tweening = ref(false);
  const sketch = shallowRef<Sketch | null>(null);
  const sketchId = computed(() => sketch.value?._id || null);
  const shader = ref();
  const uniforms = ref<Variant>({});
  const magicNumber = 0.8;
  const keyboardIndex = ref(0);
  const index = computed(() => {
    let ind = -1;
    if (!sketchId.value) return ind;
    for (let i = 0; i < pubLen.value; i++) {
      const id = published.value[i]._id;
      if (id === sketchId.value) ind = i;
    }
    return ind;
  });

  /**
   * An array of each working uniform key.
   *
   * ['zoom', 'rotation', 'invert']
   *
   */
  const uniformKeys = computed(() => Object.keys(uniforms.value || {}));

  /**
   * Each working uniform key, serialized, comma-delimited.
   *
   * 'zoom,rotation,true'
   *
   */
  const uniformKeysSerialized = computed(() => uniformKeys.value.join(","));

  /**
   * An array of each working uniform value.
   *
   * [
   *    1.231,
   *   12.212,
   *     true
   * ]
   *
   */
  const uniformValues = computed(() => uniformKeys.value.map((v: string) => (uniforms.value as any)?.[v]?.value));

  /**
   * Each working uniform value, serialized, comma-delimited.
   *
   * '1.231,12.212,true'
   *
   */
  const uniformValuesSerialized = computed(() => uniformValues.value.join(","));

  /**
   * The `activeVariant` is a reference to the original state of the active sketch's selected variant.
   */
  const activeVariant = computed(() => clone(sketch?.value?.variants?.[variant.value] || {}));

  /**
   * An array of each `activeVariant` key.
   *
   * ['zoom', 'rotation', 'invert']
   */
  const activeVariantKeys = computed(() => Object.keys(activeVariant.value));

  /**
   * Each `activeVariant` key, serialized, comma-delimited.
   *
   * 'zoom,rotation,true'
   */
  const activeVariantKeysSerialized = computed(() => activeVariantKeys.value.join(","));

  /**
   * An array of each `activeVariant` value.
   *
   * [
   *    1.231,
   *   12.212,
   *     true
   * ]
   */
  const activeVariantValues = computed(() => activeVariantKeys.value.map((v) => activeVariant.value[v]?.value));

  /**
   * Each `activeVariant` value, serialized, comma-delimited.
   *
   * '1.231,12.212,true'
   */
  const activeVariantValuesSerialized = computed(() => activeVariantValues.value.join(","));

  const uniformKeysDirty = computed(() => uniformKeysSerialized.value !== activeVariantKeysSerialized.value);
  const uniformValuesDirty = computed(() => uniformValuesSerialized.value !== activeVariantValuesSerialized.value);
  const uniformsDirty = computed(() => uniformKeysDirty.value || uniformValuesDirty.value);
  const shaderDirty = computed(() => shader.value !== sketch.value?.shader);
  const isDirty = computed(() => uniformsDirty.value || shaderDirty.value);

  function selectSketch(value: Sketch, method: SelectionMethod = "pointer", internal: any = null) {
    raf.remove("variant");
    sketchSelectionMethod.value = method;
    tweening.value = false;

    const currentId = sketch.value?._id;

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

  function sampleSketches() {
    selectSketch(sample(published.value) as any);
  }

  function selectSketchById(id: string, method: SelectionMethod = "pointer") {
    selectSketch(data[ITERATION_MAP[id]], method);
  }

  function selectSketchByIndex(i: number, method: SelectionMethod = "pointer") {
    selectSketch(published.value[i], method);
  }

  function selectPreviousSketch(method: SelectionMethod = "pointer") {
    const last = pubLen.value - 1;
    const target = index.value - 1;
    if (target === -1) return selectSketchByIndex(last, method);
    selectSketchByIndex(target, method);
  }

  function selectNextSketch(method: SelectionMethod = "pointer") {
    const last = pubLen.value - 1;
    const target = index.value + 1;
    if (target > last) return selectSketchByIndex(0, method);
    selectSketchByIndex(target, method);
  }

  function getSketchById(id: string) {
    return data[ITERATION_MAP[id]];
  }

  function getStudyById(id: string) {
    return studies.value[STUDY_MAP[id]];
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

  async function selectVariant(i: number) {
    if (!sketch.value) return;
    variant.value = i;
    tweenVariant(uniforms.value, sketch.value.variants[i]);
  }

  function tweenVariant(from: Variant, to: Variant) {
    const iVariant = buildVariantInterpolator(clone(from), clone(to));
    raf.remove("variant");
    tweening.value = true;
    raf.add(
      (now, progress) => {
        uniforms.value = iVariant(progress);
        if (progress === 1) tweening.value = false;
      },
      {
        duration: 1000,
        id: "variant",
      }
    );
  }

  function toggleShuffleVariants() {
    shuffleVariants.value = !shuffleVariants.value;
  }

  function magicTween() {}

  sampleSketches();

  return {
    sampleSketches,
    variant,
    sketch,
    sketchId,
    shader,
    uniforms,
    shuffleVariants,
    studies,
    published,
    selectSketchById,
    index,
    selectSketchByIndex,
    selectPreviousSketch,
    selectNextSketch,
    getSketchById,
    selectVariant,
    tweening,
    toggleShuffleVariants,
    sketchSelectionMethod,
    addVariant,
    iterations,
    getStudyById,
    addUniform,
    uniformValues,
    shaderDirty,
    isDirty,
    uniformKeys,
    uniformKeysSerialized,
    uniformValuesSerialized,
    activeVariantKeys,
    activeVariantKeysSerialized,
    activeVariantValues,
    activeVariantValuesSerialized,
    magicNumber,
    magicTween,
    keyboardIndex,
  };
});
