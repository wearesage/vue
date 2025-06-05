import { ref, shallowRef, computed } from "vue";
import { defineStore } from "pinia";
import { clone } from "../util/clone";
import { sample } from "../util/arrays";
import data from "../data/shaders/iterations.json";
import studyData from "../data/shaders/studies.json";

const STUDY_MAP = studyData.reduce((acc: any, study: any, i: number) => {
  acc[study._id] = i;
  return acc;
}, {});

const ITERATION_MAP = data.reduce((acc: any, iteration: any, i: number) => {
  acc[iteration._id.$oid] = i;
  return acc;
}, {});

const published = studyData[STUDY_MAP["66f2980c92cc9d303e380427"]].iterations.map((id: any) => data[ITERATION_MAP[id]]);

export const useSketches = defineStore("sketches", () => {
  const sketches = shallowRef<any>(data);
  const sketch = ref<any>(null);
  const studies = shallowRef<any>(studyData);
  const variant = ref(0);
  const shader = ref();
  const uniforms = ref();
  const index = computed(() => {
    const data = sketches.value.find((v: any) => v._id.$oid === sketch.value._id.$oid);
    return published.indexOf(data);
  });

  function sampleSketches() {
    sketch.value = clone(sample(published) as any);
    variant.value = 0;
    shader.value = sketch.value.shader;
    uniforms.value = clone(sketch.value.variants[0]);
  }

  function selectSketchById(id: string) {
    sketch.value = clone(data[ITERATION_MAP[id]]);
    variant.value = 0;
    shader.value = sketch.value.shader;
    uniforms.value = clone(sketch.value.variants[0]);
  }

  function selectSketchByIndex(i: number) {
    sketch.value = clone(published[i]);
    variant.value = 0;
    shader.value = sketch.value.shader;
    uniforms.value = clone(sketch.value.variants[0]);
  }

  function updateShader(e: string) {
    shader.value = e;
  }

  function selectPreviousSketch() {
    const nextIndex = Math.max(index.value - 1, 0);
    if (nextIndex === index.value) return;
    selectSketchByIndex(nextIndex);
  }

  function selectNextSketch() {
    const nextIndex = Math.min(index.value + 1, published.length - 1);
    if (nextIndex === index.value) return;
    selectSketchByIndex(nextIndex);
  }

  sampleSketches();

  return {
    sketches,
    sampleSketches,
    variant,
    sketch,
    shader,
    uniforms,
    updateShader,
    studies,
    published,
    selectSketchById,
    index,
    selectSketchByIndex,
    selectPreviousSketch,
    selectNextSketch,
  };
});
