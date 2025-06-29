import { formatTimeAgo as _formatTimeAgo } from "@vueuse/core";

const MAP_AGO: any = {};

export function formatTimeAgo(date: string) {
  if (MAP_AGO[date]) return MAP_AGO[date];
  MAP_AGO[date] = _formatTimeAgo(new Date(date));
  return MAP_AGO[date];
}