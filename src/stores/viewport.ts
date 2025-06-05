import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { createCssVariable } from "../util/styles";

export const useViewport = defineStore("viewport", () => {
  const width = ref(1);
  const height = ref(1);
  const aspectRatio = computed(() => width.value / height.value);
  const dpr = ref();
  const touch = ref();
  const isMobile = computed(() => touch.value);
  const clicked = ref([-1, -1]);
  const mouse = ref([-1, -1]);
  const popoverVisible = ref(false);

  const artboard = computed(() => {
    return {
      width: width.value * dpr.value,
      height: height.value * dpr.value,
      css: {
        width: `${width.value}px`,
        height: `${height.value}px`,
      },
    };
  });

  function set() {
    width.value = window.innerWidth;
    height.value = window.innerHeight;
    dpr.value = window.devicePixelRatio;
    touch.value = "ontouchstart" in window;
    createCssVariable("--viewport-width", `${width.value}px`);
    createCssVariable("--viewport-height", `${height.value}px`);
  }

  set();

  window.addEventListener("resize", set);

  document.body.addEventListener("click", (e) => {
    clicked.value = [e.clientX, e.clientY];
  });

  document.body.addEventListener("mousemove", (e) => {
    mouse.value = [e.clientX, e.clientY];
  });

  return {
    width,
    height,
    dpr,
    aspectRatio,
    touch,
    isMobile,
    clicked,
    mouse,
    popoverVisible,
    artboard,
  };
});
