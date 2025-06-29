import { uniformRangeUtils } from "./uniform-range-utils";
import { randomNumber } from "./random-number";
import { toPrecision } from "./to-precision";
import { type Variant } from "../types";

const { getMin, getMax, getStep } = uniformRangeUtils;

export function generateVariant(sketch: Variant): Variant {
  return Object.keys(sketch).reduce((acc: Variant, key: string) => {
    const uniform = sketch[key];

    switch (typeof uniform.value) {
      case "object":
        // currently, only colors (vec3)
        acc[key] = { value: [toPrecision(Math.random(), 3), toPrecision(Math.random(), 3), toPrecision(Math.random(), 3)] };
        break;
      case "boolean":
        // don't tween bools
        acc[key] = { value: uniform.value };
        break;
      case "number":
        // don't tween ints
        if (getStep(key, uniform.value) === 1) {
          acc[key] = { value: uniform.value };
        } else {
          const min = getMin(key, uniform.value as number);
          const max = getMax(key, uniform.value as number);
          const value = randomNumber(min, max);
          acc[key] = { value: toPrecision(value, 5) };
        }

        break;
    }

    return acc;
  }, {} as Variant);
}
