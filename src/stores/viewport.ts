import { defineStore, acceptHMRUpdate } from "pinia";
import { ref, computed } from "vue";
import { createCssVariable, coord } from "../util";
import { useFullscreen } from "@vueuse/core";

export const useViewport = defineStore("viewport", () => {
  const width = ref(window.innerWidth);
  const height = ref(window.innerHeight);
  const aspectRatio = computed(() => width.value / height.value);
  const dpr = ref(window.devicePixelRatio);
  const clicked = ref(coord(-1, -1));
  const mouse = ref(coord(-1, -1));
  const touch = ref("ontouchstart" in window);
  const scrollY = ref(0);
  const scrollPosition = ref(coord(0, 0)); // Actual scroll position
  const { isFullscreen, exit: exitFullscreen, enter: enterFullscreen, isSupported: fullscreenSupported } = useFullscreen();

  async function onScroll(e: number) {
    scrollY.value += e;
  }

  function setScrollPosition(x: number, y: number) {
    scrollPosition.value = coord(x, y);
  }

  function set() {
    width.value = window.innerWidth;
    height.value = window.innerHeight;
    dpr.value = window.devicePixelRatio;
    touch.value = "ontouchstart" in window;
    createCssVariable("--viewport-width", `${width.value}px`);
    createCssVariable("--viewport-height", `${height.value}px`);
  }

  function mouseMove(e: MouseEvent) {
    const x = e.clientX;
    const y = e.clientY;
    mouse.value = coord(x, y);
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

  document.body.addEventListener("pointerdown", (e) => {
    const [x, y] = [e.clientX, e.clientY];
    clicked.value = coord(x, y);
    triggerMouse();
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
    mouseMove,
    scrollY,
    scrollPosition,
    onScroll,
    setScrollPosition,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useViewport, import.meta.hot));
}
