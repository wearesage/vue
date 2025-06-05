import { computed, ref, watchEffect, type Ref, watch } from "vue";
import { useAnimation } from "./useAnimation";
import { drawBoard, drawPieces, initializePieces, getSquareFromCoordinates, getPieceAt, calculatePossibleMoves, getMoveNotation, type ChessPiece } from "../util/chess";
import { useCanvas2d } from "./useCanvas2d";
import { useViewport } from "../stores/viewport";

function getSelectedPieceAnimationState() {
  return {
    relevant: false,
    active: false,
    direction: false,
    duration: 150,
    timestamp: null,
    interpolator: null,
    done: false,
    last: null,
    reset: null,
  } as any;
}

export function useChessBoard(boardCanvas: Ref<HTMLCanvasElement>, piecesCanvas: Ref<HTMLCanvasElement>, boardSize: Ref<number>) {
  const viewport = useViewport();
  const squareSize = computed(() => boardSize.value / 8);
  const artboard = computed(() => ({ width: boardSize.value, height: boardSize.value, dpr: viewport.dpr }));
  const $board = useCanvas2d(boardCanvas, artboard);
  const $pieces = useCanvas2d(piecesCanvas, artboard);
  const state = ref({
    pieces: initializePieces(),
    moveList: [] as string[],
    turn: "white",
  });
  const selectedPiece = ref<ChessPiece | null>(null);
  const possibleMoves = ref<unknown[]>([]);
  const animations = ref({
    selectedPiece: {} as any,
  });

  function resetSelectedPieceAnimationState() {
    animations.value.selectedPiece = getSelectedPieceAnimationState();
    animations.value.selectedPiece.reset = resetSelectedPieceAnimationState;
  }

  resetSelectedPieceAnimationState();

  watch(
    () => selectedPiece.value,
    (val: any, old: any) => {
      if (val) {
        animations.value.selectedPiece.direction = true;
      } else {
        animations.value.selectedPiece.direction = false;
        animations.value.selectedPiece.last = old;
      }

      animations.value.selectedPiece.timestamp = window.performance.now();
      animations.value.selectedPiece.relevant = true;
    }
  );

  watch(
    () => state.value,
    () => {
      animations.value.selectedPiece?.reset?.();
    },
    { deep: true }
  );

  // Handle canvas clicks
  const handleClick = (event: MouseEvent) => {
    if (!piecesCanvas.value) return;

    const rect = piecesCanvas.value.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const square = getSquareFromCoordinates(x, y, squareSize.value);
    const clickedPiece = getPieceAt(state.value.pieces, square);

    if (selectedPiece.value) {
      // If a piece is already selected, try to move it
      const isValidMove = possibleMoves.value.some((move: any) => move.row === square.row && move.col === square.col);

      if (isValidMove) {
        // Store the original position
        const fromSquare = { ...selectedPiece.value.position };

        // Check if this is a capture
        const capturedPiece = getPieceAt(state.value.pieces, square);
        const isCapture = !!capturedPiece;

        if (capturedPiece) state.value.pieces = state.value.pieces.filter((p) => p !== capturedPiece);

        // Generate move notation BEFORE moving the piece
        const moveNotation = getMoveNotation(selectedPiece.value, fromSquare, square, isCapture, state.value.pieces);

        // Add move to move list
        if (state.value.turn === "white") {
          // Add move number for white's moves
          const moveNumber = Math.floor(state.value.moveList.length / 2) + 1;
          state.value.moveList.push(`${moveNumber}. ${moveNotation}`);
        } else {
          // Just add the move for black
          state.value.moveList.push(moveNotation);
        }

        // Move the piece
        selectedPiece.value.position = square;
        selectedPiece.value.hasMoved = true;
        selectedPiece.value = null;
        possibleMoves.value = [];
        state.value.turn = state.value.turn === "white" ? "black" : "white";
      } else if (clickedPiece && clickedPiece.color === state.value.turn) {
        // Select a new piece of the current player
        selectedPiece.value = clickedPiece;
        possibleMoves.value = calculatePossibleMoves(state.value.pieces, clickedPiece);
      } else {
        // Deselect
        selectedPiece.value = null;
        possibleMoves.value = [];
      }
    } else if (clickedPiece && clickedPiece.color === state.value.turn) {
      // Select a piece
      selectedPiece.value = clickedPiece;
      possibleMoves.value = calculatePossibleMoves(state.value.pieces, clickedPiece);
    }
  };

  // Attach click handler when canvas is ready
  watchEffect(() => {
    if (piecesCanvas.value) {
      piecesCanvas.value.addEventListener("click", handleClick);
      return () => piecesCanvas.value?.removeEventListener("click", handleClick);
    }
  });

  useAnimation(() => {
    drawBoard({ ...$board, size: squareSize.value, pieces: state.value.pieces, selectedPiece: selectedPiece.value, possibleMoves: possibleMoves.value, animations: animations.value });
    drawPieces({ ...$pieces, size: squareSize.value, pieces: state.value.pieces, selectedPiece: selectedPiece.value, possibleMoves: possibleMoves.value });
  });

  return {
    possibleMoves,
    selectedPiece,
    state,
  };
}
