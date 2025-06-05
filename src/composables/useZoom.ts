import { ref, onMounted, type Ref, type ComputedRef, watch } from "vue";
import { select } from "d3-selection";
import { zoom, zoomIdentity, ZoomTransform, type D3ZoomEvent } from "d3-zoom";
import "d3-transition";

interface ZoomOptions {
  minZoom?: number;
  maxZoom?: number;
  translateExtent?: [[number, number], [number, number]];
  scaleExtent?: [number, number];
  duration?: number;
  touchEnabled?: boolean;
}

export function useZoom(
  element: Ref<HTMLElement | null>,
  options: Ref | ComputedRef<ZoomOptions>,
  filterFn?: (event: any) => boolean
) {
  const transform = ref<ZoomTransform>(zoomIdentity);
  const zoomBehavior = zoom<HTMLElement, unknown>()
    .scaleExtent(options.value.scaleExtent || [.1, 10])
    .on("zoom", (event: D3ZoomEvent<HTMLElement, unknown>) => {
      transform.value = event.transform;
    });

  // Add filter function to prevent zoom during node interactions if filterFn is provided
  if (filterFn) {
    zoomBehavior.filter(event => {
      // If filterFn returns true, the event should be filtered out (not handled by zoom)
      return !filterFn(event);
    });
  }

  const touchEnabled = options.value.touchEnabled !== false;

  if (options.value.translateExtent) {
    zoomBehavior.translateExtent(options.value.translateExtent);
  }

  watch(
    () => options.value,
    (val) => {
      if (val.translateExtent) {
        zoomBehavior.translateExtent(val.translateExtent);
      }

      if (val.scaleExtent) {
        zoomBehavior.scaleExtent(val.scaleExtent);
      }
    }
  );

  function resetZoom(duration = options.value.duration || 250) {
    if (!element.value) return;

    select(element.value)
      .transition()
      .duration(duration)
      .call(zoomBehavior.transform, zoomIdentity);
  }

  function setTransform(
    newTransform: ZoomTransform,
    duration = options.value.duration || 0
  ) {
    if (!element.value) return;

    select(element.value)
      .transition()
      .duration(duration)
      .call(zoomBehavior.transform, newTransform);
  }

  onMounted(() => {
    if (!element.value) return;
    const selection = select(element.value);
    selection.call(zoomBehavior);
    if (touchEnabled) element.value.style.touchAction = "none";
  });

  return {
    transform,
    zoomBehavior,
    resetZoom,
    setTransform,
    updateFilter: (newFilterFn: (event: any) => boolean) => {
      zoomBehavior.filter(event => !newFilterFn(event));
    }
  };
}
