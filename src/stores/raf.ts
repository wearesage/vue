import { v4 } from "uuid";
import { defineStore } from "pinia";
import { ref, shallowRef, type Ref } from "vue";
import { ease, clamp } from "../util";
export type AnimationTick = (now: number, progress: number, elapsed: number) => void;

export type Animation = {
  tick?: AnimationTick;
  duration?: number;
  id: string;
  start?: number;
  autoStart?: boolean;
  easing?: (v: number) => number;
  state?: Ref<boolean>;
};

export const useRAF = defineStore("raf", () => {
  const queue: any = shallowRef([]);
  const map: any = shallowRef({});
  let raf: any = ref(0);
  let last: any = null;
  let frameNumber = ref(0);
  let frames: any[] = [];
  const time: Ref<number> = ref(window.performance.now());
  const frameRate: any = ref(60);
  const promises: any = {};
  const preFrame: any = ref([]);

  function add(tick: AnimationTick, animation: Animation) {
    remove(animation?.id);

    animation.tick = tick;
    animation.easing = animation.easing || ease;
    animation.start = window.performance.now();

    if (raf.value === 0) start();

    if (animation.duration) {
      queue.value.push(animation);
      return new Promise((resolve) => {
        promises[animation.id as string] = resolve;
      });
    } else {
      map.value[animation.id] = animation;
    }
  }

  function remove(id: string) {
    delete map.value[id];
    delete promises[id];
    const queueIndex = queue.value.findIndex((animation: Animation) => animation.id === id);
    if (queueIndex !== -1) queue.value.splice(queueIndex, 1);
  }

  function start() {
    stop();
    raf.value = window.requestAnimationFrame(tick);
  }

  function stop() {
    window.cancelAnimationFrame(raf.value);
  }

  function frame(now: DOMHighResTimeStamp) {
    if (last === null) {
      last = now;
      return;
    }

    const boundary = 180;
    frames.push(1000 / (now - last));
    if (frames.length > boundary) frames.splice(0, frames.length - boundary);
    let sum = 0;
    for (let i = 0; i < frames.length; i++) sum += frames[i];
    frameRate.value = Math.floor(sum / frames.length);
    last = now;
  }

  function tick(now: DOMHighResTimeStamp) {
    frameNumber.value++;
    time.value = window.performance.now();

    preFrame.value.forEach((fn: (now: DOMHighResTimeStamp) => void) => {
      fn(now);
    });

    queue.value.forEach((animation: Animation, i: number) => {
      const elapsed = now - (animation?.start || 0);
      const duration = animation.duration || Infinity;
      const progress = clamp(animation.easing?.(elapsed / duration) as number);
      animation.tick?.(now, progress, elapsed);

      if (progress === 1) {
        queue.value.splice(i, 1);
        promises?.[animation.id]?.();
        delete promises[animation.id];
      }
    });

    const keys = Object.keys(map.value);

    keys.forEach((id: string) => {
      const animation = map.value[id];
      const elapsed = now - (animation?.start || 0);
      const duration = animation.duration || Infinity;
      const progress = clamp(animation.easing?.(elapsed / duration) as number);
      animation.tick?.(now, progress, elapsed);

      if (progress === 1) {
        promises?.[animation.id]?.();
        delete map.value[id];
        delete promises[id];
      }
    });

    frame(now);

    if (queue.value.length > 0 || keys.length > 0) {
      raf.value = window.requestAnimationFrame(tick);
    } else {
      raf.value = 0;
    }

    preFrame.value = [];
  }

  return {
    add,
    remove,
    start,
    stop,
    time,
    map,
    queue,
    frameRate,
    preFrame,
    frameNumber,
    $reset() {
      stop();
      queue.value.length = 0;
      Object.keys(map.value).forEach((id) => delete map.value[id]);
      Object.keys(promises).forEach((id) => delete promises[id]);
      frames = [];
      last = null;
      raf.value = 0;
    },
  };
});
