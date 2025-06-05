import { ref, computed } from "vue";
import { initializePieces, type ChessPiece, getPieceAt, getMoveNotation, calculatePossibleMoves, type Square } from "../util/chess";
import { useChessPieces } from "./useChessPieces";
import { useArrowControlledRefHistory } from "./useArrowControlledRefHistory";

export function useChessMatch() {
  const state = ref({
    pieces: initializePieces(),
    moveList: [] as any,
    turn: "white",
  });

  const initialized = ref(false);
  const selectedPiece = ref<ChessPiece | null>(null);
  const possibleMoves = computed(() => {
    if (selectedPiece.value) {
      return calculatePossibleMoves(state.value.pieces, selectedPiece.value);
    } else {
      return [];
    }
  });
  const { black, white, initialize } = useChessPieces(1200) as any;

  useArrowControlledRefHistory(state);

  function getSrc(piece: ChessPiece) {
    return piece.color === "white" ? (white.value[piece.type] as string) : (black.value[piece.type] as string);
  }

  function getPieceTransform(piece: ChessPiece) {
    return `translateY(calc(${piece.position.row} * 100%)) translateX(calc(${piece.position.col} * 100%))`;
  }

  function clickSquare({ row, col }: Square) {
    const piece = getPieceAt(state.value.pieces, { row, col });

    if (selectedPiece.value) {
      if (selectedPiece.value.position.row === row && selectedPiece.value.position.col === col) {
        selectedPiece.value = null;
        return;
      }
    }

    if (piece) {
      const isOpponentPiece = piece.color !== state.value.turn;

      if (isOpponentPiece) {
        return attemptMove({ row, col });
      } else {
        selectedPiece.value = piece;
      }
    } else {
      if (selectedPiece.value) return attemptMove({ row, col });
    }
  }

  function attemptMove(square: Square) {
    const isValidMove = possibleMoves.value?.some((v: Square) => v.col === square.col && v.row === square.row);
    if (!isValidMove) {
      selectedPiece.value = null;
      return;
    }
    if (!selectedPiece.value) return;
    const fromSquare = { ...selectedPiece.value.position };
    const capturedPiece = getPieceAt(state.value.pieces, square);
    const isCapture = !!capturedPiece;
    if (capturedPiece) state.value.pieces = state.value.pieces.filter((p) => p !== capturedPiece);
    const moveNotation = getMoveNotation(selectedPiece.value, fromSquare, square, isCapture, state.value.pieces);
    state.value.moveList.push({
      notation: state.value.turn === "white" ? `${Math.floor(state.value.moveList.length / 2) + 1}. ${moveNotation}` : moveNotation,
      squares: {
        from: selectedPiece.value.position,
        to: square,
      },
    });

    selectedPiece.value.position = square;
    selectedPiece.value.hasMoved = true;
    selectedPiece.value = null;
    state.value.turn = state.value.turn === "white" ? "black" : "white";
  }

  function isPossibleMove({ row, col }: Square) {
    let match = false;

    possibleMoves.value.forEach((move: Square) => {
      if (match) return;
      if (move.row === row && move.col == col) match = true;
    });

    return match;
  }

  function specialClasses({ row, col }: Square) {
    try {
      const { squares } = state.value.moveList?.[state.value.moveList?.length - 1] || {};
      const selected = selectedPiece.value && selectedPiece.value?.position.col === col && selectedPiece.value?.position.row === row;
      const from = selectedPiece.value === null && squares.from.row === row && squares.from.col === col;
      const last = selectedPiece.value === null && squares.to.row === row && squares.to.col === col;
      const faded = selectedPiece.value && !(selectedPiece.value?.position.col === col && selectedPiece.value?.position.row === row);

      return {
        from,
        last,
        selected,
        faded,
        possible: isPossibleMove({ row, col }),
      };
    } catch (e) {
      return {};
    }
  }

  return {
    state,
    getSrc,
    getPieceTransform,
    clickSquare,
    specialClasses,
    async initialize() {
      await initialize();
      initialized.value = true;
    },
    initialized,
    selectedPiece,
    possibleMoves,
  };
}
