import { computed, type Ref } from "vue";

export function useNormalizedShaderError(error: Ref<string>, source: Ref<string>, shader: Ref<string>) {
  const normalized = computed(() => {
    try {
      const [_, col, char, problem, msg] = error.value.split(":").map((v) => v.trim());
      const offset = source.value?.replace(shader.value, "").split("\n").length || 0;
      const line = parseInt(char, 10) - offset + 1;
      if (line === -1) return {};
      const message = msg.split("\n")[0];
      return { line, column: parseInt(col, 10), message, problem };
    } catch (e) {
      return {};
    }
  });

  return normalized;
}
