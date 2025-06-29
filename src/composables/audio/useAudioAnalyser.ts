import { ref, shallowRef, computed } from "vue";
import AudioAnalyser, { definitions } from "../../classes/AudioAnalyser";
import { useRAF } from "../../stores/raf";

export function useAudioAnalyser() {
  const raf = useRAF();
  const instance = shallowRef<AudioAnalyser | null>(new AudioAnalyser({ definitions } as any));
  const stream = ref(0);
  const volume = ref(1);
  const time = computed(() => raf.time);
  const audio = ref();
  const initialized = ref(false);

  function tick() {
    if (typeof audio.value?.paused !== "boolean" || audio.value.paused === true) {
      stream.value += 0.003;
      volume.value = 1;
      return;
    }

    if (audio.value.paused === false && typeof instance.value?.tick === "function") {
      const values = instance.value?.tick(raf.frameRate) as any;
      if (!isNaN(values.stream)) stream.value = values.stream;
      if (!isNaN(values.volume)) volume.value = values.volume;
    }
  }

  function initialize(element: HTMLAudioElement) {
    if (instance.value && element) {
      audio.value = element;
      instance?.value?.destroy?.();
      instance.value?.initialize({ element });
      raf.remove("audio");
      raf.add(tick, {
        id: "audio",
      });
      initialized.value = true;
    }
  }

  function cleanup() {
    raf.remove("audio");
    instance?.value?.destroy?.();
  }

  return {
    instance,
    initialize,
    stream,
    volume,
    time,
    cleanup,
    initialized,
  };
}
