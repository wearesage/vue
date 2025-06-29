import { interpolateNumber } from "d3-interpolate";
import { ref, watch, onBeforeUnmount, type Ref } from "vue";
import { useRAF } from "../../stores/raf";

export function useAppliedVolume(volume: Ref<number>, playing: Ref<boolean>) {
  const raf = useRAF();
  const appliedVolume = ref(volume.value);

  watch(
    () => volume.value,
    (vol) => {
      if (!playing.value) return;
      appliedVolume.value = vol;
    }
  );

  watch(
    () => playing.value,
    (val) => {
      const iO = val ? interpolateNumber(1, volume.value) : interpolateNumber(volume.value, 1);
      raf.remove("player");
      raf.add(
        (now, progress) => {
          appliedVolume.value = iO(progress);
        },
        {
          id: "player",
          duration: 750,
        }
      );
    }
  );

  onBeforeUnmount(() => {
    raf.remove("player");
  });

  return appliedVolume;
}
