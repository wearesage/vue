function get(key: string) {
  try {
    const datum = localStorage.getItem(key);
    if (datum === null) return null;
    return JSON.parse(datum);
  } catch (e) {
    return null;
  }
}

function set(key: string, data: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    return null;
  }
}

export const storage = {
  get,
  set,
};
