import { EASE_IN_OUT } from "../constants/easing";
import bezier from "./bezier";
import { clamp } from ".";

const appliedEaseInOut = bezier(EASE_IN_OUT[0], EASE_IN_OUT[1], EASE_IN_OUT[2], EASE_IN_OUT[3]);

export function easeInOut(progress: number) {
  return appliedEaseInOut(clamp(progress));
}
