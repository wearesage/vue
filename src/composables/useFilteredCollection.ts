import { ref, shallowRef, computed, watch } from "vue";
import days from "../data/utility/days.json";
import months from "../data/utility/months.json";
import { isObjectId, isDate, isPhone } from "../util/types";
import { snakeToLabel, getStringValues } from "../util/strings";
import { clone } from "../util/clone";

function infer(datum: any, keys: string[], references: any = {}) {
  const ids: any = [];
  const dates: any = [];
  const phoneNumbers: any = [];
  const titles: any = [];
  const refs: any = [];
  const referenceKeys = Object.keys(references);
  const arrays: any = [];
  const objects: any = [];
  const children: any = {};

  keys.forEach((key) => {
    const value = datum[key] as any;

    if (Array.isArray(value)) {
      arrays.push(key);
    } else if (referenceKeys.includes(key)) {
      refs.push(key);
    } else if (typeof value === "object") {
      objects.push(key);
    } else if (isObjectId(value)) {
      ids.push(key);
    } else if (isDate(value, key)) {
      dates.push(key);
    } else if (isPhone(value)) {
      phoneNumbers.push(key);
    } else {
      titles.push(snakeToLabel(key));
    }
  });

  return { arrays, ids, dates, phoneNumbers, titles, refs, objects, children };
}

function process<T>(dataset: T[], references: any = {}, exclude: any[] = []) {
  const _now = window.performance.now();
  const first = dataset?.[0] || ({} as any);
  const keys = Object.keys(first) as any;
  const length = dataset.length;
  const refMap: any = {};
  let inferences: any = infer(first, keys as string[], references);

  inferences.refs.forEach((ref: any) => {
    const collection = [];
    const map: any = {};
    references[ref].forEach((v: any, i: number) => {
      collection.push(v);
      map[v._id] = i;
    });
  });

  const hasRefs = references && inferences.refs.length;

  if (hasRefs) {
    inferences.refs.forEach((key: any) => {
      refMap[key] = {};
      references[key].forEach((item: any, i) => {
        refMap[key][item._id] = i;
      });
    });
  }

  const inferenceRefMap = inferences.refs.reduce((acc, key, i) => {
    acc[key] = i;
    return acc;
  }, {} as any);

  const dateRefMap = inferences.dates.reduce((acc, key, i) => {
    acc[key] = i;
    return acc;
  }, {} as any);

  let win: any = window;

  win.__DATE_MAP = win.__DATE_MAP || {};

  const { $enriched, $values, $unique } = dataset.reduce(
    (acc, d: T) => {
      try {
        const datum: any = d;

        keys.forEach((key: string) => {
          if (exclude.indexOf(key) > -1) {
            return;
          } else if (typeof inferenceRefMap[key] !== "undefined") {
            datum[key] = references[key][refMap[key][datum[key]]];
            datum.$type === "ref";
          } else if (typeof dateRefMap[key] !== "undefined") {
            const value = datum[key] as any;
            win.__DATE_MAP[value] = win.__DATE_MAP[value] || {};
            const cache = win.__DATE_MAP[value];
            cache.date = cache.date || new Date(value);
            cache.string = cache.string || `${(months as any)[cache.date.getMonth()]} ${(days as any)[cache.date.getDay()]} ${cache.date.getFullYear()}`;
            datum[key] = cache.date as any;
            datum[`$${key}`] = cache.string;
          } else if (inferences.phoneNumbers.includes(key)) {
            const [a, b, c, d, e, f, g, h, i, j] = datum[key].replace("+1", "");
            datum[`$${key}_formal`] = `(${a}${b}${c}) ${d}${e}${f}-${g}${h}${i}${j}`;
            datum[`$${key}_dashed`] = `${a}${b}${c}-${d}${e}${f}-${g}${h}${i}${j}`;
          }
        });

        const next = Object.keys(datum).reduce((acc, key) => {
          if (exclude.indexOf(key) !== -1) return acc;
          acc[key] = (datum as any)[key];
          return acc;
        }, {} as any);

        acc.$enriched.push(next);
        acc.$values.push(getStringValues(next));

        return acc;
      } catch (e) {
        console.log(e);
        return acc;
      }
    },
    {
      $enriched: [],
      $values: [],
      $keys: [],
      $unique: keys.reduce((acc: any, key: string) => {
        acc[key] = { touched: {}, collection: [] };
        return acc;
      }, {} as any),
    } as any
  );

  inferences.$options = keys.reduce((acc: any, key: string) => {
    acc[key] = $unique[key].collection;
    return acc;
  }, {} as any);

  inferences.$enriched = $enriched;
  inferences.$values = $values;
  inferences.$total = length;

  console.log(`Processed dataset in ${Math.round(window.performance.now() - _now)}ms.`);

  return inferences;
}

function filterCollection(collection: any[], query: string) {
  const now = window.performance.now();
  const indexes: any = [];
  const q = query.split(" ");
  collection.forEach((v, i) => {
    const hit = q.every((q) => v.indexOf(q) !== -1);
    if (hit) indexes.push(i);
  });
  const ms = Math.round(window.performance.now() - now);
  const message = `Filtered collection in ${ms}ms; ${indexes.length} of ${collection.length} items visible.`;
  return { message, visible: indexes.length, total: collection.length, indexes, ms };
}

let DATASET_MAP: any = {};

export function useFilteredCollection<T>({ dataset, name, refs, onUpdate, exclude }: { dataset: T[]; name: string; refs: any; onUpdate: any; exclude: any }) {
  const query = ref("");
  const results = shallowRef<T[]>([]);
  const inferences = shallowRef<any>(null);
  const collection = shallowRef([]);
  const values = shallowRef([]);
  const keys = shallowRef([]);
  const filtered = shallowRef<any>([]);
  const total = computed(() => collection.value.length);
  const visible = computed(() => filtered.value.length);

  watch(
    () => dataset,
    (val) => {
      DATASET_MAP[name] = DATASET_MAP[name] || process(clone(val), refs, exclude);
      inferences.value = DATASET_MAP[name];
      query.value = "";

      const { $enriched, $values } = inferences.value;

      values.value = $values;
      collection.value = $enriched;
      filtered.value = collection.value;
    },
    {
      immediate: true,
    }
  );

  watch(
    () => query.value,
    (val) => {
      const { indexes, message } = filterCollection(values.value, val.length > 1 ? query.value : "");
      filtered.value = indexes.map((v) => collection.value[v]);
      onUpdate({ message, visible, total });
    }
  );

  return {
    inferences,
    keys,
    query,
    results,
    collection,
    values,
    total,
    filtered,
    visible,
  };
}
