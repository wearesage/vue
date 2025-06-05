export function hashMap(object: Record<any, any>, key: any = null) {
  return object.reduce((acc, k, i) => {
    acc[key || k] = i
    return acc
  }, {} as any)
}