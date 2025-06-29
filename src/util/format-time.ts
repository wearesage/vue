import { formatDate as _formatDate } from "@vueuse/core";

const MAP: any = {};

export function formatTime(date: string) {
  if (MAP[date]) return MAP[date];
  MAP[date] = _formatDate(new Date(date), "MMM. DD YYYY");
  return MAP[date];
}