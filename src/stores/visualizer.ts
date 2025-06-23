import { defineStore } from "pinia";
import { ref, computed, watch, render } from "vue";
import { useMagicKeys } from "@vueuse/core";
import { useAudioAnalyser } from "../composables/useAudioAnalyser";
import { useSketches } from "./sketches";
import { useAudioElement } from "../composables/useAudioElement";
import { useViewport } from "./viewport";

export const AudioSources = ["SPOTIFY", "AUDIUS", "MICROPHONE", "RADIO_PARADISE", "KEXP", "FILE"] as const;
export type AudioSource = (typeof AudioSources)[number];
export const AudioSourceIcons: Record<AudioSource, string> = {
  SPOTIFY: "spotify",
  AUDIUS: "audius",
  MICROPHONE: "microphone",
  RADIO_PARADISE: "radio-paradise",
  KEXP: "kexp",
  FILE: "upload",
};

const MOUSE_TIMEOUT = 1750;

export const useVisualizer = defineStore("visualizer", () => {
  const viewport = useViewport();
  const sketches = useSketches();
  const { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } = useMagicKeys();
  const { initialize, volume, stream } = useAudioAnalyser();
  const src = ref("/music/braids/plath.heart.mp3");
  const { element, playing, play, pause, toggle } = useAudioElement(src, initialize);
  const source = ref<AudioSource | null>(null);
  const showMenu = ref(false);
  const forceHide = ref(false);
  const showEditor = ref(false);
  const showCustomize = ref(false);
  const showChat = ref(false);
  const showDesigns = ref(false);
  const showSettings = ref(false);
  const showSources = ref(false);
  const showSliders = ref(true);
  const scrollY = ref(0);
  const subMenuOpen = computed(() => showSources.value || showCustomize.value || showSettings.value);
  const menuVisible = computed(() => showMenu.value && !subMenuOpen.value);
  const sourceIcon = computed(() => AudioSourceIcons?.[source.value as AudioSource] || "sound");
  const showMenuTimeout = ref<any>(null);
  const forceHideTimeout = ref<any>(null);
  const renderIndex = ref(0);

  watch(
    () => viewport.mouse,
    () => {
      if (forceHide.value) return;
      clearTimeout(showMenuTimeout.value);
      showMenu.value = true;
      showMenuTimeout.value = setTimeout(() => {
        showMenu.value = false;
      }, MOUSE_TIMEOUT);
    }
  );

  watch(
    () => sketches.sketch,
    () => {
      clearTimeout(showMenuTimeout.value);
      clearTimeout(forceHideTimeout.value);

      forceHide.value = true;
      showMenu.value = false;
      renderIndex.value++;

      if (sketches.sketchSelectionMethod !== "internal") {
        showCustomize.value = false;
        showEditor.value = false;
      }

      forceHideTimeout.value = setTimeout(
        () => {
          forceHide.value = false;
        },
        sketches.sketchSelectionMethod === "pointer" ? MOUSE_TIMEOUT / 2 : 100
      );
    }
  );

  watch(ArrowLeft, (val) => {
    if (val) {
      if (subMenuOpen.value) return;
      sketches.selectPreviousSketch("keyboard");
    }
  });

  watch(ArrowUp, (val) => {
    if (val) {
      if (subMenuOpen.value) return;
      sketches.selectPreviousSketch("keyboard");
    }
  });

  watch(ArrowRight, (val) => {
    if (val) {
      if (subMenuOpen.value) return;
      sketches.selectNextSketch("keyboard");
    }
  });

  watch(ArrowDown, (val) => {
    if (val) {
      if (subMenuOpen.value) return;
      sketches.selectNextSketch("keyboard");
    }
  });

  function selectSource(newSource: AudioSource) {
    if (AudioSources.includes(newSource)) {
      source.value = newSource;

      switch (newSource) {
        case "MICROPHONE":
          console.log("microphone");
          break;
        case "AUDIUS":
          console.log("audius");
          break;
        default:
      }
    } else {
      console.warn(`Invalid audio source: ${newSource}`);
    }
  }

  function toggleEditor() {
    showEditor.value = !showEditor.value;
  }

  function toggleCustomize() {
    showCustomize.value = !showCustomize.value;
  }

  function toggleChat() {
    showChat.value = !showChat.value;
  }

  function toggleSettings() {
    showSettings.value = !showSettings.value;
  }

  function toggleSources() {
    showSources.value = !showSources.value;
  }

  function toggleSliders() {
    showSliders.value = !showSliders.value;
  }

  async function onScroll(e: number) {
    scrollY.value += e;
    viewport.triggerMouse();
  }

  return {
    source,
    sourceIcon,
    selectSource,
    toggleEditor,
    showEditor,
    showCustomize,
    toggleCustomize,
    showChat,
    menuVisible,
    showSources,
    toggleSources,
    toggleSettings,
    showMenu,
    showDesigns,
    forceHide,
    showSettings,
    toggleChat,
    initialize,
    volume,
    stream,
    element,
    playing,
    play,
    pause,
    toggle,
    scrollY,
    showSliders,
    toggleSliders,
    renderIndex,
    onScroll,
  };
});
