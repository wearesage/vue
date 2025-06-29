export function get(key: string) {
  try {
    const datum = localStorage.getItem(key);
    if (datum === null) return null;
    return JSON.parse(datum);
  } catch (e) {
    return null;
  }
}