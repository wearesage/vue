import { defineStore } from "pinia";

const ROOT = import.meta.env.VITE_SERVER + "/api";

export const useAPI = defineStore("api", () => {
  async function get(url: string) {
    try {
      const data = await fetch(ROOT + url).then((res) => res.json());
      return data;
    } catch (e) {
      console.log(e);
    }
  }

  return {
    get,
  };
});
