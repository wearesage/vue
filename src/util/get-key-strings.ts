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