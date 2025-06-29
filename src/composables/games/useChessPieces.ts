import { ref, nextTick, shallowRef, reactive, type Ref } from "vue";
import { useCanvas2d, type Artboard } from "../";
import { king, queen, pawn, rook, bishop, knight } from "../../util";

const PIECES = ["king", "queen", "rook", "bishop", "knight", "pawn"] as const;

type Piece = (typeof PIECES)[number];
type PieceData = Record<Piece, null | string>;

const DRAW_FUNCTIONS: Record<Piece, any> = { king, queen, pawn, rook, bishop, knight };

export function useChessPieces(s: any) {
  const black = ref<PieceData>({
    king: null,
    queen: null,
    rook: null,
    bishop: null,
    knight: null,
    pawn: null,
  });

  const white = ref<PieceData>({
    king: null,
    queen: null,
    rook: null,
    bishop: null,
    knight: null,
    pawn: null,
  });

  const $size = reactive(s);
  const canvas = shallowRef(document.getElementById("CHESS_CANVAS") || document.createElement("canvas"));
  const size = ref({ width: $size / 8, height: $size / 8, dpr: window.devicePixelRatio }) as Artboard;

  canvas.value.id = "CHESS_CANVAS";
  canvas.value.style.position = "fixed";
  canvas.value.style.top = "0px";
  canvas.value.style.left = "0px";

  const context = useCanvas2d(canvas as Ref<HTMLCanvasElement>, size);

  async function initialize() {
    context.normalize();

    const next: any = {
      white: {},
      black: {},
    };

    for (const piece of PIECES) {
      context.clear();
      context.normalize();
      const centerX = $size / 16;
      const centerY = $size / 20;
      DRAW_FUNCTIONS[piece]({ ...context, x: centerX, y: centerY, radius: $size / 48, fillStyle: "white" });
      await nextTick();
      next.white[piece] = context.ctx?.value?.canvas?.toDataURL?.() as string;
      context.clear();
      context.normalize();
      DRAW_FUNCTIONS[piece]({ ...context, x: centerX, y: centerY, radius: $size / 48, fillStyle: "black" });
      await nextTick();
      next.black[piece] = context.ctx?.value?.canvas?.toDataURL?.() as string;
    }

    black.value = next.black;
    white.value = next.white;
  }

  return {
    initialize,
    black,
    white,
  };
}
