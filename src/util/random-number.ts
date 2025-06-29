import { clamp } from "./clamp";

export function randomNumber(min = 0, max = 1) {
  return clamp(Math.random() * max, min, max);
}
