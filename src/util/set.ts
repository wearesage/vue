export function set(key: string, data: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    return null;
  }
}