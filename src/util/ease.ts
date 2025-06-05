import { DEFAULT_EASING } from "../data/constants/easing";
import bezier from "./bezier";
import { clamp } from "./numbers";

const appliedDefault = bezier(DEFAULT_EASING[0], DEFAULT_EASING[1], DEFAULT_EASING[2], DEFAULT_EASING[3]);

export function ease(progress: number) {
  return appliedDefault(clamp(progress));
}
