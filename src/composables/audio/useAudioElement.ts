import { ref, watch, type Ref } from "vue";

export function useAudioElement(track: Ref<string | null>, initialize?: (element: HTMLAudioElement) => void) {
  const element = ref(document.createElement("audio"));
  const playing = ref(false);
  const initialized = ref(false);

  element.value.crossOrigin = "anonymous";
  element.value.preload = "auto";

  if (track.value) {
    element.value.src = track.value;
  }

  watch(track, (newTrack) => {
    if (newTrack) {
      element.value.src = newTrack;
      playing.value = true;
      toggle();
    }
  });

  function toggle() {
    if (!element.value) return;
    if (!initialized.value) {
      if (initialize) initialize(element.value);
      initialized.value = true;
    }

    if (playing.value) {
      element.value.pause();
      playing.value = false;
    } else {
      element.value.play();
      playing.value = true;
    }
  }

  function play() {
    if (!element.value) return;
    if (!initialized.value) {
      if (initialize) initialize(element.value);
      initialized.value = true;
    }
    element.value.play();
    playing.value = true;
  }

  function pause() {
    if (!element.value) return;
    element.value.pause();
    playing.value = false;
  }

  return {
    toggle,
    playing,
    play,
    pause,
    element,
    initialized,
  };
}
