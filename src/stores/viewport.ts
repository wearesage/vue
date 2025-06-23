import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { createCssVariable, coord } from "../util";
import { useFullscreen } from "@vueuse/core";

export const useViewport = defineStore("viewport", () => {
  const { isFullscreen, exit: exitFullscreen, enter: enterFullscreen, isSupported: fullscreenSupported } = useFullscreen();
  const width = ref(window.innerWidth);
  const height = ref(window.innerHeight);
  const aspectRatio = computed(() => width.value / height.value);
  const dpr = ref(window.devicePixelRatio);
  const clicked = ref(coord(-1, -1));
  const mouse = ref(coord(-1, -1));
  const touch = ref("ontouchstart" in window);

  function set() {
    width.value = window.innerWidth;
    height.value = window.innerHeight;
    dpr.value = window.devicePixelRatio;
    touch.value = "ontouchstart" in window;
    createCssVariable("--viewport-width", `${width.value}px`);
    createCssVariable("--viewport-height", `${height.value}px`);
  }

  function triggerMouse() {
    const { x, y } = mouse.value;
    mouse.value = coord(x, y);
  }

  function toggleFullscreen() {
    if (isFullscreen.value) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }

  set();

  window.addEventListener("resize", set);

  document.body.addEventListener("click", (e) => {
    const [x, y] = [e.clientX, e.clientY];
    clicked.value = coord(x, y);
  });

  document.body.addEventListener("mousemove", (e) => {
    const [x, y] = [e.clientX, e.clientY];
    mouse.value = coord(x, y);
  });

  return {
    width,
    height,
    dpr,
    aspectRatio,
    clicked,
    mouse,
    triggerMouse,
    toggleFullscreen,
    fullscreenSupported,
  };
});
