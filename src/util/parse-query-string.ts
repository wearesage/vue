export function parseQueryString(): Record<string, unknown> {
  const values = [...new URLSearchParams(location.search).entries()];
  return values.reduce((acc: Record<string, unknown>, [key, value]) => {
    acc[key] = value;
    return acc;
  }, {});
}