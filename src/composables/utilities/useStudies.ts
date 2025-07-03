import { computed, type Ref } from "vue";
import { hashMap, transformLegacySketch, isValidSketch, cleanStudyIterations, clone, type LegacySketch } from "../../util";
// TEMPORARY: Commenting out huge shader JSON data for build size
import legacyData from "../../data/shaders/old.json";
import studyData from "../../data/shaders/studies.json";
import { Sketch } from "../../types";

// TEMPORARY: Empty data for build testing
// const legacyData: LegacySketch[] = [];
// const studyData: any[] = [];

const sketches = (legacyData as LegacySketch[]).filter(isValidSketch).map(transformLegacySketch);
const validSketchIds = new Set<string>(sketches.map((sketch) => sketch._id));
const studies = cleanStudyIterations(studyData, validSketchIds);
const STUDY_MAP = hashMap(studies, "_id");
const SKETCH_MAP = hashMap(sketches, "_id");

function getStudyById(id: string) {
  const study = clone(studies[STUDY_MAP[id]]);
  if (!study) return { iterations: [], _id: null };
  return { ...study, iterations: study.iterations.map(getSketchById) };
}

function getSketchById(id: string) {
  return clone(sketches[SKETCH_MAP[id]]);
}

export function useStudies(activeStudy: Ref<string>, activeSketchId: Ref<string | null>) {
  const study = computed(() => getStudyById(activeStudy.value));
  const iterations = computed<Sketch[]>(() => study.value.iterations);
  const index = computed<number>(() => {
    if (activeSketchId.value === null) return -1;
    const sketch = iterations.value.find((v: Sketch) => v._id === activeSketchId.value);
    if (!sketch) return -1;
    return iterations.value.indexOf(sketch);
  });

  console.log(iterations.value);
  return {
    iterations,
    index,
    getStudyById,
    getSketchById,
  };
}
