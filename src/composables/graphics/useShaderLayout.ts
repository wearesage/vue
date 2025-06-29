import { ref, computed, watch } from "vue";
import { useRAF } from "../../stores/raf";
import { interpolateNumber } from "d3-interpolate";
import { Sketch } from "../../types/sketches";
import { type ShaderScrollProps } from "../../types/sketches";

export function useShaderLayout(props: ShaderScrollProps) {
  const manualScaleFactor = ref(0);
  const rotation = ref(0);
  const size = computed(() => 0.2);
  const zoom = ref(0.2);
  const scrollOffset = ref(0);
  const virtualIndices = ref<number[]>([]);
  const iScale = interpolateNumber(0, 1);
  const iRotation = interpolateNumber(0, Math.PI / 3);
  const iZoom = interpolateNumber(0.2, 1);
  const raf = useRAF();
  const shouldRender = computed(() => manualScaleFactor.value > 0);
  const initialized = ref(false);

  function setVirtualIndices(sketches: Sketch[]) {
    virtualIndices.value = sketches.map((_, i) => i) as number[];
  }

  watch(
    () => props?.sketches,
    (val) => {
      setVirtualIndices(val);
      updateVirtualIndices();
    },
    {
      immediate: true,
    }
  );

  watch(
    () => props.scrollY,
    (val) => {
      scrollOffset.value = -val / -500;
      updateVirtualIndices();
    }
  );

  watch(
    () => props.visible,
    (val) => {
      if (initialized.value === false) {
        initialized.value = true;
        if (!val) return;
      }

      raf.remove("zoom");
      raf.add(
        (now, progress) => {
          const p = val ? progress : 1 - progress;
          zoom.value = iZoom(p);
          manualScaleFactor.value = iScale(p);
          rotation.value = iRotation(p);
        },
        { duration: 500, id: "zoom" }
      );
    },
    { immediate: true }
  );

  function getScale(index: number): number {
    const virtualIndex = virtualIndices.value[index];
    const basePosition = getBasePosition(virtualIndex);
    const [x, y, z] = basePosition;
    const effectiveY = y + scrollOffset.value;
    const distanceFromCenter = Math.sqrt(x * x + effectiveY * effectiveY);
    const maxDistance = 0.5;
    const minScale = 0.0;
    const maxScale = 1.85;
    const normalizedDistance = Math.max(distanceFromCenter / maxDistance, 0.75);
    const scale = maxScale - normalizedDistance * (maxScale - minScale);
    const result = Math.max(minScale, scale) * manualScaleFactor.value;
    return result;
  }

  function getBasePosition(index: number): [number, number, number] {
    const rowHeight = (size.value / 0.2) * 0.14;
    const colWidth = (size.value / 0.2) * 0.17;

    if (index < 0) {
      let currentIndex = Math.abs(index) - 1;
      let row = -1;
      while (currentIndex >= 0) {
        const isEvenRow = row % 2 === 0;
        const itemsInThisRow = isEvenRow ? 3 : 2;

        if (currentIndex < itemsInThisRow) {
          const posInRow = currentIndex;
          const baseX = isEvenRow ? (posInRow - 1) * colWidth : (posInRow - 0.5) * colWidth;
          const baseY = -row * rowHeight;
          return [baseX, baseY, 0.01];
        }

        currentIndex -= itemsInThisRow;
        row--;
      }

      return [0, 0, 0];
    }

    let currentIndex = index;
    let row = 0;

    while (currentIndex >= 0) {
      const isEvenRow = row % 2 === 0;
      const itemsInThisRow = isEvenRow ? 3 : 2;

      if (currentIndex < itemsInThisRow) {
        const posInRow = currentIndex;
        const baseX = isEvenRow ? (posInRow - 1) * colWidth : (posInRow - 0.5) * colWidth;
        const baseY = -row * rowHeight;
        return [baseX, baseY, 0.01];
      }

      currentIndex -= itemsInThisRow;
      row++;
    }

    return [0, 0, 0.01];
  }

  function getPosition(index: number): [number, number, number] {
    const virtualIndex = virtualIndices.value[index];
    const [baseX, baseY, baseZ] = getBasePosition(virtualIndex);
    const scale = getScale(index);
    const attractionStrength = 1 - scale;
    const pullFactor = attractionStrength;
    const adjustedX = baseX * (1.5 - pullFactor);
    return [adjustedX, baseY, baseZ];
  }

  function updateVirtualIndices() {
    virtualIndices.value.forEach((virtualIndex: number, realIndex: number) => {
      const [x, baseY, z] = getBasePosition(virtualIndex);
      const effectiveY = baseY + scrollOffset.value;

      if (effectiveY > 1) {
        const maxVirtualIndex = Math.max(...virtualIndices.value);
        virtualIndices.value[realIndex] = maxVirtualIndex + 1;
      } else if (effectiveY < -2) {
        const minVirtualIndex = Math.min(...virtualIndices.value);
        virtualIndices.value[realIndex] = minVirtualIndex - 1;
      }
    });
  }

  return {
    updateVirtualIndices,
    getPosition,
    getScale,
    manualScaleFactor,
    rotation,
    zoom,
    scrollOffset,
    shouldRender,
  };
}
