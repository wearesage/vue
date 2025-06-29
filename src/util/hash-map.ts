export function hashMap<T>(collection: T[], key: string) {
  const obj: Record<string, number> = {};
  return collection.reduce((acc, item, i) => {
    acc[(item as any)[key]] = i;
    return acc;
  }, obj);
}
