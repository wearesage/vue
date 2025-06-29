export function sample(array: unknown[]) {
  return array[Math.floor(Math.random() * array.length)];
}