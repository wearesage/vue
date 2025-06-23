// import { Vector3 } from "three";
// import { type ComputedRef, type Ref } from "vue";

// const ControlTypeEnum = ["slider", "number", "toggle", "color", "vector"] as const;
// export type ControlTypeString = (typeof ControlTypeEnum)[number];
// export type SimpleValue = number | boolean | string;
// export type VectorValue = { x: number; y: number; z: number };
// export type ColorValue = { r: number; g: number; b: number };
// export type MetaValue<T = SimpleValue> = {
//   value: T;
//   disabled?: boolean;
//   min?: number;
//   max?: number;
//   step?: number;
//   label?: string;
//   type?: ControlTypeString;
// };

// export type ControlValue = SimpleValue | VectorValue | ColorValue | MetaValue<SimpleValue | VectorValue | ColorValue>;
// export type ControlsConfig = Record<string, ControlValue> | string[];
// export interface ControlPanel {
//   label?: ComputedRef<string | undefined>;
//   state: Record<string, any>;
//   meta: Record<string, any>;
//   ranges: Record<string, any>;
//   setValue: (key: string, value: any) => void;
//   setDisabled: (key: string, disabled: boolean) => void;
//   reset: () => void;
//   onInput: (key: string, value: any) => void;
//   $types: ComputedRef<string[]>;
// }

// export function normalizeControlValue<T extends ControlValue>(value: T, key: string): MetaValue<any> {
//   if (typeof value === "object" && value !== null && "value" in value) {
//     return {
//       type: inferControlType(value.value, key),
//       ...(value as MetaValue<any>),
//     };
//   } else if (isVectorLike(value)) {
//     return {
//       value: value as VectorValue,
//       disabled: false,
//       type: "vector",
//     };
//   } else if (isColorLike(value)) {
//     return {
//       value: value as ColorValue,
//       disabled: false,
//       type: "color",
//     };
//   } else {
//     return {
//       value: value as SimpleValue,
//       disabled: false,
//       type: inferControlType(value, key),
//     };
//   }
// }

// export function inferControlType(value: any, key: string): ControlTypeString {
//   if (typeof value === "boolean") return "toggle";
//   if (typeof value === "number") return "slider";
//   if (key.toLowerCase().includes("color") || (typeof value === "object" && "r" in value)) return "color";
//   if (isVectorLike(value)) return "vector";
//   return "number";
// }

// export function isVectorLike(value: any): value is VectorValue {
//   return typeof value === "object" && value !== null && "x" in value && "y" in value && "z" in value;
// }

// export function isColorLike(value: any): value is ColorValue {
//   return typeof value === "object" && value !== null && "r" in value && "g" in value && "b" in value;
// }

// export function setObjectProperty(target: any, key: string, value: any) {
//   if (!target) return;

//   try {
//     if (isVectorLike(value)) {
//       if (target[key]) {
//         if (target[key].set) {
//           target[key].set(value.x, value.y, value.z);
//         } else {
//           target[key].x = value.x;
//           target[key].y = value.y;
//           target[key].z = value.z;
//         }
//       } else {
//         target[key] = new Vector3(value.x, value.y, value.z);
//       }
//     } else if (isColorLike(value)) {
//       if (target[key] && target[key].setRGB) {
//         target[key].setRGB(value.r, value.g, value.b);
//       } else {
//         target[key] = value;
//       }
//     } else {
//       target[key] = value;
//     }
//   } catch (error) {
//     console.warn(`Failed to set property ${key} on target:`, error);
//   }
// }

// export function clampValue(value: number, min?: number, max?: number): number {
//   if (min !== undefined && value < min) return min;
//   if (max !== undefined && value > max) return max;
//   return value;
// }

// export function calculateAutoRange(value: any): { min: number; max: number; step: number } {
//   if (typeof value === "number") {
//     if (value === 0) {
//       return { min: -1, max: 1, step: 0.01 };
//     }

//     // Calculate half-range, with minimum of 0.25
//     const halfRange = Math.max(Math.abs(value) / 2, 0.25);

//     return {
//       min: value - halfRange,
//       max: value + halfRange,
//       step: 0.01,
//     };
//   }
//   return { min: 0, max: 1, step: 0.01 };
// }

// export function inferInstanceTypes(ref: Ref<unknown> | any) {
//   let obj = ref?.value || { value: ref };

//   if (!obj.value) return [];

//   const types = [];

//   if (obj.value?.instance) {
//     obj = obj.value?.instance;
//     const tresType = obj.value?.instance?.__tres?.type;
//     if (typeof tresType === "string") {
//       types.push(tresType);
//     }
//   }

//   types.push(
//     ...Object.keys(obj)
//       .filter((v) => v[0] + v[1] === "is" && obj[v] === true)
//       .map((v) => v.split("is")[1])
//   );

//   return types;
// }

// export function generateLabel(targetRef: any) {
//   try {
//     const types = inferInstanceTypes(targetRef);
//     if (types.length > 0) {
//       const primaryType = types[types.length - 1];
//       return primaryType?.replace(/([A-Z])/g, " $1")?.trim?.() || "";
//     }
//   } catch (e) {
//     return "Controls";
//   }
// }
