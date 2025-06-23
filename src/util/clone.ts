type Primitive = string | number | boolean | null | undefined | symbol | bigint;

type DeepClone<T> = T extends Primitive
  ? T
  : T extends Date
  ? Date
  : T extends Array<infer U>
  ? Array<DeepClone<U>>
  : T extends object
  ? { [K in keyof T]: DeepClone<T[K]> }
  : T;

export function clone<T>(value: T): DeepClone<T> {
  if (value === null || value === undefined) return value as DeepClone<T>;
  if (typeof value !== "object") return value as DeepClone<T>;

  if (Array.isArray(value)) {
    return value.map((item) => clone(item)) as DeepClone<T>;
  }

  if (value instanceof Date) {
    return new Date(value.getTime()) as DeepClone<T>;
  }

  if (value.constructor === Object) {
    const cloned = {} as any;
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        cloned[key] = clone(value[key]);
      }
    }
    return cloned;
  }

  return value as DeepClone<T>;
}
