import { formatTimeAgo as _formatTimeAgo, formatDate as _formatDate } from "@vueuse/core";

export function pause(ms: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, ms);
  });
}

const MAP: any = {};

export function formatTime(date: string) {
  if (MAP[date]) return MAP[date];
  MAP[date] = _formatDate(new Date(date), "MMM. DD YYYY");
  return MAP[date];
}

const MAP_AGO: any = {};

export function formatTimeAgo(date: string) {
  if (MAP_AGO[date]) return MAP_AGO[date];
  MAP_AGO[date] = _formatTimeAgo(new Date(date));
  return MAP_AGO[date];
}

export function formatSeconds(s: number) {
  const minutes = Math.floor(s / 60);
  const seconds = `${s % 60}`.padEnd(2, "0");
  return `${minutes}:${seconds}`;
}
