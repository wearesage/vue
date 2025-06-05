import { onMounted, ref, computed, watch, type Ref, onUnmounted, nextTick, type Reactive, reactive, type ComputedRef } from "vue";
import type { ZoomTransform } from "d3-zoom";

export type Artboard =
  | Ref
  | ComputedRef<{
      width: number;
      height: number;
      dpr: number;
    }>;

export type CanvasState = {
  ctx: CanvasRenderingContext2D | null;
  canvas: HTMLCanvasElement | null;
  width: number;
  height: number;
  center: {
    x: number;
    y: number;
  };
  dpr: number;
  mouse: [number, number];
};

export function useCanvas2d(canvas: Ref<HTMLCanvasElement | null>, artboard: Artboard, transform?: Ref | Reactive<ZoomTransform>) {
  const ctx = ref<CanvasRenderingContext2D | null>(null);
  const mouse = ref<[number, number] | null>(null);
  const $transform = reactive(transform || { x: 0, y: 0, k: 1 });

  watch(
    () => artboard.value,
    async () => {
      await nextTick();
      resize();
    },
    { deep: true }
  );

  // Watch for changes in transform to ensure we redraw when zoom changes
  watch(
    () => $transform,
    () => {
      // Request an animation frame to redraw with the new transform
      requestAnimationFrame(() => {
        if (ctx.value) {
          // Signal that the transform has changed and a redraw might be needed
          ctx.value.canvas.dispatchEvent(new CustomEvent("transform-changed"));
        }
      });
    },
    { deep: true }
  );

  const state = computed(() => {
    const { width, height, dpr } = artboard.value;

    return {
      ctx: ctx.value,
      canvas: canvas.value,
      width,
      height,
      center: {
        x: width / 2,
        y: height / 2,
      },
      dpr: dpr,
      mouse: mouse.value,
    };
  });

  function resize() {
    if (!canvas.value) return;

    const { width, height, dpr } = artboard.value;

    canvas.value.width = width * dpr;
    canvas.value.height = height * dpr;
    canvas.value.style.width = width + "px";
    canvas.value.style.height = height + "px";
  }

  function clear() {
    if (!canvas.value || !ctx.value) return;

    // Save the current transform
    ctx.value.save();

    // Reset the transform to identity to clear the entire canvas
    ctx.value.resetTransform();

    // Clear the entire canvas
    ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height);

    // Restore the transform
    ctx.value.restore();
  }

  function fill(color = "#ffffff") {
    if (!canvas.value || !ctx.value) return;
    ctx.value.save();
    ctx.value.resetTransform();
    ctx.value.fillStyle = color;
    ctx.value.fillRect(0, 0, canvas.value.width, canvas.value.height);
    ctx.value.restore();
  }

  function normalize() {
    if (!ctx.value) return;

    const { dpr } = artboard.value;

    // Reset to identity transform
    ctx.value.resetTransform();

    // Apply device pixel ratio scaling
    ctx.value.scale(dpr, dpr);

    // Apply d3-zoom transform
    const t = $transform;
    ctx.value.translate(t.x, t.y);
    ctx.value.scale(t.k, t.k);
  }

  function draw(fn: (s: CanvasRenderingContext2D) => void) {
    if (!ctx.value) return;
    ctx.value.save();
    fn(ctx.value as CanvasRenderingContext2D);
    ctx.value.restore();
  }

  type CircleProps = {
    x: number;
    y: number;
    radius: number;
    lineWidth?: number;
    strokeStyle?: string;
    fillStyle?: string;
  };

  function circle({ x, y, radius, lineWidth, strokeStyle, fillStyle }: CircleProps) {
    if (!ctx.value) return;
    if (lineWidth) ctx.value.lineWidth = lineWidth;
    if (strokeStyle) ctx.value.strokeStyle = strokeStyle;
    if (fillStyle) ctx.value.fillStyle = fillStyle;
    ctx.value.beginPath();
    ctx.value.arc(x, y, radius, 0, Math.PI * 2);
    ctx.value.closePath();
    if ((!lineWidth && !strokeStyle) || fillStyle) ctx.value.fill();
    if (strokeStyle || lineWidth) ctx.value.stroke();
  }

  type RadiusProps = {
    x: number;
    y: number;
    rX: number;
    rY: number;
    rotation: number;
    lineWidth?: number;
    strokeStyle?: string;
    fillStyle?: string;
  };

  function ellipse({ x, y, rX, rY, rotation, lineWidth, strokeStyle, fillStyle }: RadiusProps) {
    if (!ctx.value) return;
    if (lineWidth) ctx.value.lineWidth = lineWidth;
    if (strokeStyle) ctx.value.strokeStyle = strokeStyle;
    if (fillStyle) ctx.value.fillStyle = fillStyle;
    ctx.value.beginPath();
    ctx.value.ellipse(x, y, rX, rY, rotation, 0, Math.PI * 2);
    ctx.value.closePath();
    if (fillStyle) ctx.value.fill();
    if (strokeStyle || lineWidth) ctx.value.stroke();
  }

  function handleMouseMove(e: MouseEvent) {
    if (!canvas.value) return;

    const rect = canvas.value.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if ($transform) {
      const t = $transform;
      mouse.value = [(x - t.x) / t.k, (y - t.y) / t.k];
    } else {
      mouse.value = [x, y];
    }
  }

  function handleMouseLeave() {
    mouse.value = null;
  }

  onMounted(() => {
    resize();
    ctx.value = canvas.value?.getContext("2d") || null;

    if (canvas.value) {
      canvas.value.addEventListener("mousemove", handleMouseMove);
      canvas.value.addEventListener("mouseleave", handleMouseLeave);
    }
  });

  onUnmounted(() => {
    if (canvas.value) {
      canvas.value.removeEventListener("mousemove", handleMouseMove);
      canvas.value.removeEventListener("mouseleave", handleMouseLeave);
    }
  });

  return {
    state,
    ctx,
    draw,
    clear,
    normalize,
    circle,
    mouse,
    ellipse,
    fill,
  };
}
