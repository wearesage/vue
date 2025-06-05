export function capitalizeFirstLetter(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function capitalizeEveryWord(str: string): string {
  if (!str) return str;
  return str.split(" ").map(capitalizeFirstLetter).join(" ");
}

export function lowercaseFirstLetter(str: string): string {
  if (!str) return str;
  return str.charAt(0).toLowerCase() + str.slice(1);
}

export function replaceAllSubstrings(
  str: string,
  substring: string,
  newValue = ""
) {
  return str.split(substring).join(newValue);
}

export function replaceAllWords(str: string, substring: string, newValue = "") {
  const regex = new RegExp(`(?<!\\.)\\b${substring}\\b`, "g");
  return str.replace(regex, newValue);
}

export function snakeToCamel(str: any) {
  return str.replace(/_([a-z])/g, (match: any, p1: any) => p1.toUpperCase());
}

export function snakeToLabel(str: any) {
  if (str === '_id') return 'ID'
  const split = str.split("_");
  if (split.length === 0) return capitalizeFirstLetter(split);
  return split.map(capitalizeFirstLetter).join(" ");
}

export function toOptionList(arr: string[]) {
  return arr.map((v) => ({
    value: v,
    text: snakeToLabel(v),
  }));
}

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

export function getKeyStrings(value: any): any {
  if (Array.isArray(value)) return value.map((v: any) => getKeyStrings(v));

  if (value && typeof value === 'object') {
    try {
      return getKeyStrings(Object.keys(value))
    } catch (e) {
      console.log(e)
    }
  }

  return value
}