<template>
  <main
    ref="container"
    :class="{ centered, cascade }"
    @scroll="onScroll"
    @mousemove="e => onMouseMove(e)"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd">
    <slot></slot>
  </main>
</template>

<script setup lang="ts">
import { useRoute } from "../../router/sage-router";
import { onMounted, ref } from "vue";
import { useViewport, useRAF } from "../../stores";
import { interpolateBasis } from "d3-interpolate";
import bezier from "../../util/bezier";

const viewport = useViewport();
const route = useRoute();
const container = ref();
const LS_KEY = ref("view:scrollTop" + route.path);
const { centered, cascade } = defineProps<{
  centered?: boolean;
  cascade?: boolean;
}>();

const $emit = defineEmits(["wheel"]);

const raf = useRAF();

let touchStartY = 0;
let touchStartTime = 0;
let lastTouchY = 0;
let lastTouchTime = 0;
let velocityY = 0;
let isScrolling = ref(false);
let isMomentumScrolling = ref(false);
let velocityHistory: Array<{ velocity: number; time: number }> = [];

const VELOCITY_HISTORY_LIMIT = 5;

function onScroll(e: any) {
  localStorage.setItem(LS_KEY.value, `${e.target.scrollTop}`);

  // Update viewport with actual scroll position
  viewport.setScrollPosition(e.target.scrollLeft || 0, e.target.scrollTop || 0);
}

function onWheel(e: WheelEvent) {
  raf.preFrame.push(() => {
    viewport.onScroll(e.deltaY);
  });
}

function onMouseMove(e: MouseEvent) {
  raf.preFrame.push(() => {
    viewport.mouseMove(e);
  });
}

function onTouchStart(e: TouchEvent) {
  const target = e.target as HTMLElement;

  if (
    target &&
    (target.tagName === "INPUT" ||
      target.tagName === "BUTTON" ||
      target.tagName === "SELECT" ||
      target.tagName === "TEXTAREA" ||
      target.closest("input, button, select, textarea, [contenteditable]"))
  ) {
    isScrolling.value = false;
    return;
  }

  const touch = e.touches[0];

  touchStartY = touch.clientY;
  touchStartTime = Date.now();
  lastTouchY = touch.clientY;
  lastTouchTime = touchStartTime;
  velocityY = 0;
  isScrolling.value = true;

  if (isMomentumScrolling) {
    raf.remove("inertial-scroll");
    isMomentumScrolling.value = false;
  }

  velocityHistory = [];
}

function onTouchMove(e: TouchEvent) {
  if (!isScrolling) return;

  const target = e.target as HTMLElement;

  if (
    target &&
    (target.tagName === "INPUT" ||
      target.tagName === "BUTTON" ||
      target.tagName === "SELECT" ||
      target.tagName === "TEXTAREA" ||
      target.closest("input, button, select, textarea, [contenteditable]"))
  ) {
    return;
  }

  const touch = e.touches[0];
  const currentY = touch.clientY;
  const currentTime = Date.now();
  const deltaY = lastTouchY - currentY;

  raf.preFrame.push(() => {
    viewport.onScroll(deltaY);
  });

  $emit("wheel", deltaY);

  const timeDiff = currentTime - lastTouchTime;

  if (timeDiff > 0) {
    const instantVelocity = deltaY / timeDiff;
    velocityHistory.push({ velocity: instantVelocity, time: currentTime });
    if (velocityHistory.length > VELOCITY_HISTORY_LIMIT) {
      velocityHistory.shift();
    }
  }

  lastTouchY = currentY;
  lastTouchTime = currentTime;
  e.preventDefault();
}

function onTouchEnd(e: TouchEvent) {
  if (!isScrolling) return;

  isScrolling.value = false;

  let finalVelocity = 0;

  if (velocityHistory.length <= 0) return;

  let totalWeight = 0;
  let weightedSum = 0;

  velocityHistory.forEach((entry, index) => {
    const weight = index + 1;
    weightedSum += entry.velocity * weight;
    totalWeight += weight;
  });

  finalVelocity = totalWeight > 0 ? weightedSum / totalWeight : 0;

  const absVelocity = Math.abs(finalVelocity);

  if (absVelocity > 0.1) {
    velocityY = finalVelocity;
    startMomentumScroll();
  }
}

function startMomentumScroll() {
  if (isMomentumScrolling.value) return;
  isMomentumScrolling.value = true;
  const baseVelocity = Math.abs(velocityY);
  const duration = baseVelocity * 1000;
  const iS = interpolateBasis([baseVelocity * 20, 0]);
  const velocityScale = baseVelocity * (velocityY > 0 ? 1 : -1);
  raf.add(
    (now, progress) => {
      if (!isMomentumScrolling.value) return;
      const interpolatedValue = iS(progress);
      const deltaY = interpolatedValue * velocityScale;
      viewport.onScroll(deltaY);
      $emit("wheel", deltaY);

      if (progress === 1) {
        isMomentumScrolling.value = false;
      }
    },
    {
      duration,
      easing: bezier(0, 1.04, 0.63, 1),
      id: "inertial-scroll"
    }
  );
}

onMounted(() => {
  try {
    const saved = Number(localStorage.getItem(LS_KEY.value));
    if (!isNaN(saved)) container.value.scrollTop = saved;
  } catch (e) {
    // how many fucks were given
  }
});
</script>

<style lang="scss" scoped>
main {
  @include size(100vw, 100%);
  @include flex-column(start, start);
  @include hide-scroll-bar;
  position: fixed;
  z-index: 2;
  top: 0;
  left: 0;
  will-change: transform, opacity;
}

.centered {
  @include flex-column(center, center);
}

.cascade > * {
  @include cascade;
}
</style>
