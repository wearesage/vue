export function snakeToCamel(str: any) {
  return str.replace(/_([a-z])/g, (match: any, p1: any) => p1.toUpperCase());
}