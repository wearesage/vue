import { ref, computed } from "vue";
import {
  initializePieces,
  type ChessPiece,
  type GameState,
  getPieceAt,
  getMoveNotation,
  calculatePossibleMoves,
  isCastlingMove,
  isEnPassantMove,
  type Square,
} from "../../util/chess";
import { useChessPieces } from "./useChessPieces";
import { useArrowControlledRefHistory } from "..";

export function useChessMatch() {
  const state = ref<GameState>({
    pieces: initializePieces(),
    moveList: [] as any,
    turn: "white",
  });

  const initialized = ref(false);
  const selectedPiece = ref<ChessPiece | null>(null);
  const possibleMoves = computed(() => {
    if (selectedPiece.value) {
      return calculatePossibleMoves(state.value.pieces, selectedPiece.value, state.value);
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

    const piece = selectedPiece.value;
    const fromSquare = { ...piece.position };
    let capturedPiece = getPieceAt(state.value.pieces, square);
    let isCapture = !!capturedPiece;

    // Handle special moves
    const isCastling = piece.type === "king" && isCastlingMove(fromSquare, square);
    const isEnPassant = isEnPassantMove(piece, fromSquare, square, state.value);

    // Handle en passant capture
    if (isEnPassant) {
      const capturedPawnSquare = { row: fromSquare.row, col: square.col };
      capturedPiece = getPieceAt(state.value.pieces, capturedPawnSquare);
      isCapture = true;
    }

    // Remove captured piece
    if (capturedPiece) {
      state.value.pieces = state.value.pieces.filter((p) => p !== capturedPiece);
    }

    // Handle castling - move the rook
    if (isCastling) {
      const rookFromCol = square.col === 6 ? 7 : 0; // Kingside or queenside
      const rookToCol = square.col === 6 ? 5 : 3;
      const rook = getPieceAt(state.value.pieces, { row: fromSquare.row, col: rookFromCol });
      if (rook) {
        rook.position = { row: fromSquare.row, col: rookToCol };
        rook.hasMoved = true;
      }
    }

    const moveNotation = getMoveNotation(piece, fromSquare, square, isCapture, state.value.pieces, state.value);

    // Update game state
    state.value.lastMove = {
      piece: { ...piece },
      from: fromSquare,
      to: square,
      captured: capturedPiece || undefined,
    };

    state.value.moveList.push({
      notation: moveNotation,
      piece: { ...piece },
      squares: {
        from: piece.position,
        to: square,
      },
    });

    piece.position = square;
    piece.hasMoved = true;
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
