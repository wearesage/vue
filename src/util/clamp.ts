export function clamp(number: number, min = 0, max = 1) {
  if (number < min) return min;
  if (number > max) return max;
  return number;
}