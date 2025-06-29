import { type Ref, computed, watch } from "vue";

export function useTresRender(obj: Ref<any>) {
  const app = computed(() => obj.value?.ctx?.context || {});
  const scene = computed(() => app.value?.scene?.value || {});
  const children = computed(() => scene.value?.children || []);
  const camera = computed(() => app.value?.camera?.value || {});
  const renderer = computed(() => app.value?.renderer?.value || {});
  const lights = computed(() => children?.value?.filter((v: any) => v.isLight));
  const groups = computed(() => children?.value?.filter((v: any) => v.type === "Group"));

  return {
    render(now: DOMHighResTimeStamp) {
      try {
        if (!scene.value) return;
        renderer.value.render(scene.value, camera.value);
      } catch (e) {
        console.log(e);
      }
    },
    scene,
    camera,
    renderer,
    children,
    lights,
    groups,
  };
}
