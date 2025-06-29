import { ref, watch, type Ref } from "vue";
import { useDropZone } from "@vueuse/core";
import { imageToBase64 } from "../../util";

export function useDropMultipleFiles(el: Ref<HTMLElement>) {
  const files = ref<any[]>([]);
  const { files: droppedFiles, isOverDropZone: dropping } = useDropZone(el);

  const base64 = ref<any[]>([]);

  watch(
    () => files.value,
    async () => {
      if (!files.value) return;
      base64.value = [];
      files.value.forEach(async (file: any, i: number) => {
        base64.value[i] = await imageToBase64(file);
      });
    },
    {
      immediate: true,
      deep: true,
    }
  );

  watch(
    () => droppedFiles.value,
    (latest) => {
      if (!latest) return;
      files.value.push(...latest);
    }
  );

  function remove(i: number) {
    files.value.splice(i, 1);
  }

  return {
    files,
    base64,
    dropping,
    remove,
  };
}
