export function getStringValues(value: any, ks?: any): any {
  if (Array.isArray(value)) return value.map((v: any) => getStringValues(v));

  if (value && typeof value === 'object') {
    try {
      const keys = ks || Object.keys(value);
      if (!keys.length) return ''
      return (keys || [])?.reduce?.((acc, key) => {
        acc += getStringValues(value[key]);
        return acc;
      }, '');
    } catch (e) {
      return `${value}`.toString().toLowerCase();
    }
  }

  return `${value}`.toString().toLowerCase();
}