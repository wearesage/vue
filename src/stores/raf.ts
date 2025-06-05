import { v4 } from "uuid";
import { defineStore } from "pinia";
import { ref, shallowRef, type Ref } from "vue";
import { ease } from "../util/ease";
export type AnimationTick = ({ now, progress, elapsed }: { now: DOMHighResTimeStamp; progress: number; elapsed: number }) => void;

export type Animation = {
  tick: AnimationTick;
  duration?: number;
  easing?: (i: number) => number;
  start?: number;
  id?: string;
};

export const useRAF = defineStore("raf", () => {
  const queue: any = shallowRef([]);
  const map: any = shallowRef({});
  let raf: any = 0;
  let last: any = null;
  let frames: any[] = [];
  const time: Ref<number> = ref(window.performance.now());
  const frameRate: any = ref(60);
  const promises: any = {};

  function add(animation: Animation, id: string | null = null) {
    const definition: Animation = {
      easing: ease,
      start: window.performance.now(),
      ...animation,
      id: id || v4(),
    };

    if (typeof id === "string") {
      map.value[id] = definition;
      return new Promise((resolve) => {
        promises[id] = resolve;
      });
    }

    queue.value.push(definition);

    return new Promise((resolve) => {
      promises[definition.id as string] = resolve;
    });
  }

  function remove(id: string) {
    delete map.value[id];
  }

  function start() {
    stop();
    raf = window.requestAnimationFrame(tick);
  }

  function stop() {
    window.cancelAnimationFrame(raf);
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
    time.value = window.performance.now();

    queue.value.forEach((animation: Animation, i: number) => {
      const elapsed = now - (animation?.start || 0);
      const progress = elapsed / (animation.duration || 1);
      const eased = animation.easing?.(progress) as number;
      animation.tick?.({ now, progress: eased, elapsed });
      if (eased === 1) {
        queue.value.splice(i, 1);
        promises?.[animation.id as string]?.();
      }
    });

    Object.keys(map.value).forEach((key: string) => {
      const animation = map.value[key];

      let progress = 0;

      if (typeof animation.duration === "number") {
        const elapsed = now - (animation?.start || 0);
        progress = elapsed / (animation.duration || 1);
      }

      const eased = animation.easing?.(progress) as number;

      animation.tick?.({ now, progress: eased });

      if (eased === 1) {
        delete map.value[key];
        promises?.[animation.id]?.();
      }
    });

    frame(now);

    raf = window.requestAnimationFrame(tick);
  }

  start();

  return {
    add,
    remove,
    start,
    stop,
    time,
    map,
    queue,
    frameRate,
    $reset() {
      stop();
      frames = [];
      last = window.performance.now();
    },
  };
});
