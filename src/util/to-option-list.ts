import { snakeToLabel } from "./snake-to-label";

export function toOptionList(arr: string[]) {
  return arr.map((v) => ({
    value: v,
    text: snakeToLabel(v),
  }));
}