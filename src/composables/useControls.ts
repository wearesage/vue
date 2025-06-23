import { reactive, watch, unref, computed, ref, watchEffect, type Ref, nextTick } from "vue";
import {
  normalizeControlValue,
  calculateAutoRange,
  isVectorLike,
  clampValue,
  setObjectProperty,
  inferInstanceTypes,
  generateLabel,
  type ControlsConfig,
  type ControlPanel,
  type MetaValue,
} from "../util/controls";

export function useControls<T extends ControlsConfig | string[]>(targetRef: Ref<any>, config?: T): ControlPanel {
  let controlsConfig: T;
  const settingState = ref(false);

  if (config) {
    controlsConfig = config;
  } else if (typeof targetRef?.value === "object") {
    controlsConfig = Object.keys(targetRef.value) as T;
  } else {
    controlsConfig = Object.keys(targetRef || {}) as T;
  }

  const getConfigObject = () => {
    if (Array.isArray(controlsConfig)) {
      return controlsConfig.reduce((acc, key) => {
        const target = unref(targetRef);
        if (target && key in target) {
          // Handle threejs uniform shape { value: ... }
          if (target[key] && typeof target[key] === "object" && "value" in target[key]) {
            acc[key] = target[key].value;
          } else {
            acc[key] = target[key];
          }
        } else {
          acc[key] = 0; // default value
        }
        return acc;
      }, {} as Record<string, any>);
    }
    return controlsConfig;
  };

  const normalizedConfig = ref<Record<string, MetaValue<any>>>({});

  // Function to update normalized config
  const updateNormalizedConfig = () => {
    const configObject = getConfigObject();
    const newConfig = Object.entries(configObject).reduce((acc, [key, value]) => {
      acc[key] = normalizeControlValue(value, key);
      return acc;
    }, {} as Record<string, MetaValue<any>>);
    normalizedConfig.value = newConfig;
  };

  // Initial config setup
  updateNormalizedConfig();

  const state = reactive({} as Record<string, any>);

  // Function to update state from normalized config
  const updateState = () => {
    Object.entries(normalizedConfig.value).forEach(([key, meta]) => {
      state[key] = meta.value;
    });
  };

  // Initial state setup
  updateState();

  const meta = reactive({} as Record<string, any>);

  // Function to update meta from normalized config
  const updateMeta = () => {
    Object.entries(normalizedConfig.value).forEach(([key, metaValue]) => {
      // Use current target value for auto-range calculation to avoid reactive loops
      const target = targetRef.value || targetRef;
      let currentValue = metaValue.value;

      if (target && key in target) {
        if (target[key] && typeof target[key] === "object" && "value" in target[key]) {
          currentValue = target[key].value;
        } else {
          currentValue = target[key];
        }
      }

      const autoRange = calculateAutoRange(currentValue);
      meta[key] = {
        disabled: metaValue.disabled || false,
        min: metaValue.min ?? autoRange.min,
        max: metaValue.max ?? autoRange.max,
        step: metaValue.step ?? autoRange.step,
        label: metaValue.label || key,
        type: metaValue.type || "slider",
      };
    });
  };

  const label = computed(() => generateLabel(targetRef));

  const ranges = computed(() => {
    return Object.entries(meta).reduce((acc, [key, metaValue]) => {
      if (typeof state[key] === "number") {
        acc[key] = {
          min: metaValue.min,
          max: metaValue.max,
          step: metaValue.step,
        };
      } else if (isVectorLike(state[key])) {
        acc[key] = {
          x: {
            min: metaValue.min ?? -10,
            max: metaValue.max ?? 10,
            step: metaValue.step ?? 0.01,
          },
          y: {
            min: metaValue.min ?? -10,
            max: metaValue.max ?? 10,
            step: metaValue.step ?? 0.01,
          },
          z: {
            min: metaValue.min ?? -10,
            max: metaValue.max ?? 10,
            step: metaValue.step ?? 0.01,
          },
        };
      }
      return acc;
    }, {} as Record<string, any>);
  });

  let last: any;

  watch(
    () => targetRef.value,
    (val) => {
      if (!val) return;
      const trackedValues = Object.keys(controlsConfig).reduce((acc, key) => {
        acc[key] = val[key];
        return acc;
      }, {});
      const str = JSON.stringify(trackedValues);

      if (!settingState.value) {
        updateNormalizedConfig();
        updateState();
        updateMeta();
        last = str;
      } else {
        if (last === str) {
          settingState.value = false;
        }
      }
    },
    { immediate: true }
  );

  updateMeta();

  // Set up watchers for state changes - only once
  const watcherStops = ref<(() => void)[]>([]);

  const setupStateWatchers = () => {
    // Clean up existing watchers
    watcherStops.value.forEach((stop) => stop());
    watcherStops.value = [];

    Object.keys(state).forEach((key) => {
      const stopWatcher = watch(
        () => state[key],
        (newValue) => {
          if (meta[key]?.disabled) return;

          if (typeof newValue === "number") {
            const clampedValue = clampValue(newValue, meta[key].min, meta[key].max);
            if (clampedValue !== newValue) {
              state[key] = clampedValue;
              return;
            }
          }

          // Always get the current target to maintain reactive connection
          const target = targetRef.value || targetRef;
          // Handle threejs uniform shape { value: ... }
          if (target[key] && typeof target[key] === "object" && "value" in target[key]) {
            target[key].value = newValue;
          } else {
            setObjectProperty(target, key, newValue);
          }
        },
        {
          immediate: true,
          deep: true,
        }
      );
      watcherStops.value.push(stopWatcher);
    });
  };

  // Watch for changes in normalized config to re-setup watchers
  watch(
    normalizedConfig,
    () => {
      setupStateWatchers();
    },
    { deep: true, immediate: true }
  );

  const setValue = (key: string, value: any) => {
    if (key in state) {
      settingState.value = true;
      state[key] = value;
    }
  };

  const setDisabled = (key: string, disabled: boolean) => {
    if (key in meta) {
      meta[key].disabled = disabled;
    }
  };

  const reset = () => {
    Object.entries(normalizedConfig.value).forEach(([key, metaValue]) => {
      state[key] = metaValue.value;
    });
  };

  const onInput = (key: string, value: any) => {
    if (typeof value === "boolean") {
      setValue(key, value);
    } else if (isVectorLike(value)) {
      if (key in state) {
        state[key].x = Number(Number(value.x).toFixed(3));
        state[key].y = Number(Number(value.y).toFixed(3));
        state[key].z = Number(Number(value.z).toFixed(3));
      }
    } else {
      setValue(key, Number(Number(value).toFixed(3)));
    }
  };

  return {
    label,
    state,
    meta,
    ranges,
    setValue,
    setDisabled,
    reset,
    onInput,
    $types: computed(() => inferInstanceTypes(targetRef)),
  };
}
