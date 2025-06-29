export function formatSeconds(s: number) {
  const minutes = Math.floor(s / 60);
  const seconds = `${s % 60}`.padEnd(2, "0");
  return `${minutes}:${seconds}`;
}