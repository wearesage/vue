import { storage } from "./storage";

export function createStorageNamespace(ns: string) {
  return {
    get(key: string) {
      return storage.get(`${ns}/${key}`);
    },

    set(key: string, data: unknown) {
      return storage.set(`${ns}/${key}`, data);
    },
  };
}
