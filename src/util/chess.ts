import { clamp, ease } from ".";
import { interpolateNumber } from "d3-interpolate";

const BLACK = `rgba(10, 10, 10, 1)`;
const WHITE = "rgba(255, 255, 255, 1)";

export type ChessPieceProps = { x: number; y: number; radius: number; draw: any; circle: any; ellipse?: any; fillStyle: string };
export type PieceType = "pawn" | "rook" | "knight" | "bishop" | "queen" | "king";
export type PieceColor = "white" | "black";
export type Square = { row: number; col: number };

export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
  position: Square;
  hasMoved?: boolean;
}

export interface GameState {
  pieces: ChessPiece[];
  turn: PieceColor;
  moveList: any[];
  lastMove?: {
    piece: ChessPiece;
    from: Square;
    to: Square;
    captured?: ChessPiece;
  };
}

export interface BoardState {
  pieces: ChessPiece[];
  selectedPiece: ChessPiece | null;
  possibleMoves: Square[];
  turn: PieceColor;
}

export function initializePieces(): ChessPiece[] {
  const pieces: ChessPiece[] = [];

  // Black pieces
  pieces.push({ type: "rook", color: "black", position: { row: 0, col: 0 } });
  pieces.push({ type: "knight", color: "black", position: { row: 0, col: 1 } });
  pieces.push({ type: "bishop", color: "black", position: { row: 0, col: 2 } });
  pieces.push({ type: "queen", color: "black", position: { row: 0, col: 3 } });
  pieces.push({ type: "king", color: "black", position: { row: 0, col: 4 } });
  pieces.push({ type: "bishop", color: "black", position: { row: 0, col: 5 } });
  pieces.push({ type: "knight", color: "black", position: { row: 0, col: 6 } });
  pieces.push({ type: "rook", color: "black", position: { row: 0, col: 7 } });

  // Black pawns
  for (let i = 0; i < 8; i++) {
    pieces.push({ type: "pawn", color: "black", position: { row: 1, col: i } });
  }

  // White pieces
  pieces.push({ type: "rook", color: "white", position: { row: 7, col: 0 } });
  pieces.push({ type: "knight", color: "white", position: { row: 7, col: 1 } });
  pieces.push({ type: "bishop", color: "white", position: { row: 7, col: 2 } });
  pieces.push({ type: "queen", color: "white", position: { row: 7, col: 3 } });
  pieces.push({ type: "king", color: "white", position: { row: 7, col: 4 } });
  pieces.push({ type: "bishop", color: "white", position: { row: 7, col: 5 } });
  pieces.push({ type: "knight", color: "white", position: { row: 7, col: 6 } });
  pieces.push({ type: "rook", color: "white", position: { row: 7, col: 7 } });

  // White pawns
  for (let i = 0; i < 8; i++) {
    pieces.push({ type: "pawn", color: "white", position: { row: 6, col: i } });
  }

  return pieces;
}

export function getPieceAt(pieces: ChessPiece[], square: Square): ChessPiece | null {
  return pieces.find((p) => p.position.row === square.row && p.position.col === square.col) || null;
}

export function isValidSquare(square: Square): boolean {
  return square.row >= 0 && square.row < 8 && square.col >= 0 && square.col < 8;
}

export function getSquareFromCoordinates(x: number, y: number, squareSize: number): Square {
  return {
    col: Math.floor(x / squareSize),
    row: Math.floor(y / squareSize),
  };
}

export function calculatePossibleMoves(pieces: ChessPiece[], piece: ChessPiece, gameState?: GameState): Square[] {
  switch (piece.type) {
    case "pawn":
      return calculatePawnMoves(pieces, piece, gameState);
    case "rook":
      return calculateRookMoves(pieces, piece);
    case "knight":
      return calculateKnightMoves(pieces, piece);
    case "bishop":
      return calculateBishopMoves(pieces, piece);
    case "queen":
      return calculateQueenMoves(pieces, piece);
    case "king":
      return calculateKingMoves(pieces, piece, gameState);
  }
}

function calculatePawnMoves(pieces: ChessPiece[], piece: ChessPiece, gameState?: GameState): Square[] {
  const moves: Square[] = [];
  const { row, col } = piece.position;
  const direction = piece.color === "white" ? -1 : 1;
  const startRow = piece.color === "white" ? 6 : 1;

  // Move forward one square
  const oneForward = { row: row + direction, col };
  if (isValidSquare(oneForward) && !getPieceAt(pieces, oneForward)) {
    moves.push(oneForward);

    // Move forward two squares from starting position
    if (row === startRow) {
      const twoForward = { row: row + 2 * direction, col };
      if (!getPieceAt(pieces, twoForward)) {
        moves.push(twoForward);
      }
    }
  }

  // Capture diagonally
  const captureLeft = { row: row + direction, col: col - 1 };
  const captureRight = { row: row + direction, col: col + 1 };

  if (isValidSquare(captureLeft)) {
    const leftPiece = getPieceAt(pieces, captureLeft);
    if (leftPiece && leftPiece.color !== piece.color) {
      moves.push(captureLeft);
    }
  }

  if (isValidSquare(captureRight)) {
    const rightPiece = getPieceAt(pieces, captureRight);
    if (rightPiece && rightPiece.color !== piece.color) {
      moves.push(captureRight);
    }
  }

  // En passant
  if (gameState?.lastMove) {
    const lastMove = gameState.lastMove;
    const enPassantRow = piece.color === "white" ? 3 : 4;

    // Check if last move was a pawn moving two squares
    if (
      lastMove.piece.type === "pawn" &&
      Math.abs(lastMove.from.row - lastMove.to.row) === 2 &&
      lastMove.to.row === row &&
      Math.abs(lastMove.to.col - col) === 1 &&
      row === enPassantRow
    ) {
      const enPassantSquare = { row: row + direction, col: lastMove.to.col };
      if (isValidSquare(enPassantSquare)) {
        moves.push(enPassantSquare);
      }
    }
  }

  return moves;
}

function calculateRookMoves(pieces: ChessPiece[], piece: ChessPiece): Square[] {
  const moves: Square[] = [];
  const directions = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ]; // right, left, down, up

  for (const [dRow, dCol] of directions) {
    for (let i = 1; i < 8; i++) {
      const newSquare = { row: piece.position.row + dRow * i, col: piece.position.col + dCol * i };

      if (!isValidSquare(newSquare)) break;

      const pieceAtSquare = getPieceAt(pieces, newSquare);
      if (!pieceAtSquare) {
        moves.push(newSquare);
      } else {
        if (pieceAtSquare.color !== piece.color) {
          moves.push(newSquare);
        }
        break;
      }
    }
  }

  return moves;
}

function calculateKnightMoves(pieces: ChessPiece[], piece: ChessPiece): Square[] {
  const moves: Square[] = [];
  const knightMoves = [
    [-2, -1],
    [-2, 1],
    [-1, -2],
    [-1, 2],
    [1, -2],
    [1, 2],
    [2, -1],
    [2, 1],
  ];

  for (const [dRow, dCol] of knightMoves) {
    const newSquare = { row: piece.position.row + dRow, col: piece.position.col + dCol };

    if (isValidSquare(newSquare)) {
      const pieceAtSquare = getPieceAt(pieces, newSquare);
      if (!pieceAtSquare || pieceAtSquare.color !== piece.color) {
        moves.push(newSquare);
      }
    }
  }

  return moves;
}

function calculateBishopMoves(pieces: ChessPiece[], piece: ChessPiece): Square[] {
  const moves: Square[] = [];
  const directions = [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ]; // diagonals

  for (const [dRow, dCol] of directions) {
    for (let i = 1; i < 8; i++) {
      const newSquare = { row: piece.position.row + dRow * i, col: piece.position.col + dCol * i };

      if (!isValidSquare(newSquare)) break;

      const pieceAtSquare = getPieceAt(pieces, newSquare);
      if (!pieceAtSquare) {
        moves.push(newSquare);
      } else {
        if (pieceAtSquare.color !== piece.color) {
          moves.push(newSquare);
        }
        break;
      }
    }
  }

  return moves;
}

function calculateQueenMoves(pieces: ChessPiece[], piece: ChessPiece): Square[] {
  // Queen moves like rook + bishop
  return [...calculateRookMoves(pieces, piece), ...calculateBishopMoves(pieces, piece)];
}

function calculateKingMoves(pieces: ChessPiece[], piece: ChessPiece, gameState?: GameState): Square[] {
  const moves: Square[] = [];
  const kingMoves = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];

  for (const [dRow, dCol] of kingMoves) {
    const newSquare = { row: piece.position.row + dRow, col: piece.position.col + dCol };

    if (isValidSquare(newSquare)) {
      const pieceAtSquare = getPieceAt(pieces, newSquare);
      if (!pieceAtSquare || pieceAtSquare.color !== piece.color) {
        moves.push(newSquare);
      }
    }
  }

  // Castling
  if (!piece.hasMoved && gameState) {
    const row = piece.position.row;

    // Check kingside castling
    const kingsideRook = getPieceAt(pieces, { row, col: 7 });
    if (kingsideRook && kingsideRook.type === "rook" && kingsideRook.color === piece.color && !kingsideRook.hasMoved) {
      // Check if squares between king and rook are empty
      if (
        !getPieceAt(pieces, { row, col: 5 }) &&
        !getPieceAt(pieces, { row, col: 6 }) &&
        !isSquareUnderAttack(pieces, { row, col: 4 }, piece.color) &&
        !isSquareUnderAttack(pieces, { row, col: 5 }, piece.color) &&
        !isSquareUnderAttack(pieces, { row, col: 6 }, piece.color)
      ) {
        moves.push({ row, col: 6 });
      }
    }

    // Check queenside castling
    const queensideRook = getPieceAt(pieces, { row, col: 0 });
    if (queensideRook && queensideRook.type === "rook" && queensideRook.color === piece.color && !queensideRook.hasMoved) {
      // Check if squares between king and rook are empty
      if (
        !getPieceAt(pieces, { row, col: 1 }) &&
        !getPieceAt(pieces, { row, col: 2 }) &&
        !getPieceAt(pieces, { row, col: 3 }) &&
        !isSquareUnderAttack(pieces, { row, col: 4 }, piece.color) &&
        !isSquareUnderAttack(pieces, { row, col: 3 }, piece.color) &&
        !isSquareUnderAttack(pieces, { row, col: 2 }, piece.color)
      ) {
        moves.push({ row, col: 2 });
      }
    }
  }

  return moves;
}

export function isSquareUnderAttack(pieces: ChessPiece[], square: Square, byColor: PieceColor): boolean {
  const oppositeColor = byColor === "white" ? "black" : "white";

  for (const piece of pieces) {
    if (piece.color === oppositeColor) {
      // For pawns, check diagonal attacks only
      if (piece.type === "pawn") {
        const direction = piece.color === "white" ? -1 : 1;
        const attackSquares = [
          { row: piece.position.row + direction, col: piece.position.col - 1 },
          { row: piece.position.row + direction, col: piece.position.col + 1 },
        ];

        if (attackSquares.some((attackSquare) => attackSquare.row === square.row && attackSquare.col === square.col)) {
          return true;
        }
      } else {
        // For other pieces, use their regular move calculation but exclude en passant/castling
        const possibleMoves = calculatePossibleMoves(pieces, piece);
        if (possibleMoves.some((move) => move.row === square.row && move.col === square.col)) {
          return true;
        }
      }
    }
  }

  return false;
}

export function isCastlingMove(from: Square, to: Square): boolean {
  return Math.abs(from.col - to.col) === 2 && from.row === to.row;
}

export function isEnPassantMove(piece: ChessPiece, from: Square, to: Square, gameState?: GameState): boolean {
  if (piece.type !== "pawn" || !gameState?.lastMove) return false;

  const lastMove = gameState.lastMove;
  const captureRow = piece.color === "white" ? 3 : 4;

  return (
    from.row === captureRow &&
    to.row === (piece.color === "white" ? 2 : 5) &&
    Math.abs(from.col - to.col) === 1 &&
    lastMove.piece.type === "pawn" &&
    Math.abs(lastMove.from.row - lastMove.to.row) === 2 &&
    lastMove.to.col === to.col &&
    lastMove.to.row === from.row
  );
}

export function drawBoard({ clear, normalize, draw, size: s, animations, selectedPiece }: any) {
  clear();
  normalize();

  draw((ctx: CanvasRenderingContext2D) => {
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const odd = x % 2 === 1 && y % 2 === 1;
        const even = x % 2 === 0 && y % 2 === 0;
        ctx.fillStyle = odd || even ? "rgba(200, 160, 150,1)" : "rgba(160, 120, 138, 1)";
        ctx.fillRect(x * s, y * s, s, s);
      }
    }
  });

  try {
    const piece = animations.selectedPiece;

    if (piece.relevant && !piece.active) {
      piece.active = true;
      piece.interpolator = interpolateNumber(piece.direction ? 0 : 5, piece.direction ? 5 : 0);
    }

    if (piece.relevant) {
      piece.progress = clamp(ease((window.performance.now() - piece.timestamp) / piece.duration));

      if (piece.progress === 1) {
        piece.relevant = piece.direction;
        piece.active = false;
        piece.done = true;
        if (!piece.relevant) piece.reset();
      } else {
        piece.done = false;
      }
    }

    if (piece.relevant || piece.done) {
      const p = selectedPiece || animations.selectedPiece.last;

      if (!p) return;

      const x = p.position.col * s;
      const y = p.position.row * s;
      const lineWidth = piece.interpolator(piece.progress);

      draw((ctx: CanvasRenderingContext2D) => {
        ctx.fillStyle = "#f22d85";
        ctx.lineWidth = lineWidth;
        ctx.strokeRect(x, y, s, s);
      });
    }
  } catch (e) {
    // fuck you
  }
}

function base({ ctx, fillStyle, x, y, radius: r }: any) {
  ctx.fillStyle = fillStyle;
  ctx.beginPath();
  ctx.moveTo(x - r / 6, y + r / 2);
  ctx.lineTo(x + r / 6, y + r / 2);
  ctx.lineTo(x + r / 1.25, y + r * 2);
  ctx.lineTo(x + r * 1.25, y + r * 2);
  ctx.lineTo(x + r * 1.25, y + r * 2.5);
  ctx.lineTo(x - r * 1.25, y + r * 2.5);
  ctx.lineTo(x - r * 1.25, y + r * 2);
  ctx.lineTo(x - r / 1.25, y + r * 2);
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.fillStyle = fillStyle;
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillRect(x - r * 1.3, y + r * 1.9, r * 2.6, r / 8);
  ctx.restore();
}

export function pawn({ x, y, radius: r, draw, circle, fillStyle }: ChessPieceProps) {
  draw((ctx: CanvasRenderingContext2D) => base({ ctx, fillStyle, x, y, radius: r }));

  draw((ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    circle({
      x,
      y: y + r * 0.25,
      radius: r * 0.9,
      fillStyle,
    });
    ctx.restore();
    circle({
      x,
      y: y + r * 0.25,
      radius: r * 0.75,
      fillStyle,
    });
  });
}

export function rook({ x, y, radius, draw, fillStyle }: ChessPieceProps) {
  const lineWidth = radius / 7;

  draw((ctx: CanvasRenderingContext2D) => {
    base({ ctx, lineWidth, fillStyle, x, y, radius });
    const r = radius;
    ctx.fillRect(x - r, y + r / 2, r * 2, r / 2);
    ctx.fillRect(x - r, y - r, r / 2, r * 1.5);
    ctx.fillRect(x + r / 2, y - r, r / 2, r * 1.5);
    ctx.fillRect(x - r / 4, y - r, r / 2, r * 1.25);
  });
}

export function knight({ x, y, radius, draw, fillStyle }: ChessPieceProps) {
  const lineWidth = radius / 7;

  draw((ctx: CanvasRenderingContext2D) => {
    base({ ctx, lineWidth, fillStyle, x, y, radius });
    const r = radius;
    ctx.moveTo(x - r / 6, y + r / 2);
    ctx.lineTo(x + r, y + r * 2.5);
    ctx.lineTo(x + r * 1.5, y + r * 0.9);
    ctx.lineTo(x + r * 0.8, y - r * 0.85);
    ctx.lineTo(x - r / 2, y - r * 1.15);
    ctx.lineTo(x - r / 3, y - r / 2);
    ctx.lineTo(x - r * 1.2, y - r / 12);
    ctx.lineTo(x - r * 1, y - r / -2.5);
    ctx.lineTo(x + r / 2, y + r / 12);
    ctx.closePath();
    ctx.fill();
    ctx.save();
    ctx.fillStyle = fillStyle;
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillRect(x - r * 1.3, y + r * 1.9, r * 2.6, r / 8);
    ctx.restore();
  });
}

export function bishop({ x, y, radius: r, draw, circle, ellipse, fillStyle }: ChessPieceProps) {
  draw((ctx: CanvasRenderingContext2D) => base({ ctx, fillStyle, x, y, radius: r }));

  ellipse({
    x,
    y: y + r / 2,
    rY: r,
    rX: r / 1.25,
    rotation: Math.PI,
    fillStyle,
  });

  draw((ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.fillStyle = fillStyle;
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.moveTo(x + r / 2, y - r / 2);
    ctx.lineTo(x + r / 8, y - r / 2);
    ctx.lineTo(x, y + 1 * r);
    ctx.closePath();
    ctx.fill();
    circle({ x, y: y - r / 1.5, radius: r / 1.75, fillStyle, lineWidth: r / 10 });
    ctx.restore();
    circle({ x, y: y - r / 1.5, radius: r / 3, fillStyle });
  });
}

export function queen({ x, y, radius: r, draw, circle, fillStyle }: ChessPieceProps) {
  draw((ctx: CanvasRenderingContext2D) => {
    base({ ctx, fillStyle, x, y, radius: r });
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    circle({
      x,
      y,
      radius: r / 1.6,
      fillStyle,
    });
    ctx.restore();
    circle({
      x,
      y,
      radius: r / 2,
      fillStyle,
    });
    circle({ x: x - r / 1.25, y: y - r / 2, radius: r / 5, fillStyle });
    circle({ x: x - r / 2, y: y - r / 1, radius: r / 5, fillStyle });
    circle({ x, y: y - r / 0.85, radius: r / 5, fillStyle });
    circle({ x: x + r / 2, y: y - r / 1, radius: r / 5, fillStyle });
    circle({ x: x + r / 1.25, y: y - r / 2, radius: r / 5, fillStyle });
    ctx.save();
    ctx.lineWidth = r / 8;
    ctx.fillStyle = fillStyle;
    ctx.strokeStyle = fillStyle;
    ctx.beginPath();
    ctx.moveTo(x, y - r / 4);
    ctx.lineTo(x, y - r);
    ctx.moveTo(x, y);
    ctx.lineTo(x + r / 2, y - r);
    ctx.moveTo(x, y);
    ctx.lineTo(x + r / 1.25, y - r / 2);
    ctx.moveTo(x, y);
    ctx.lineTo(x - r / 1.25, y - r / 2);
    ctx.moveTo(x, y);
    ctx.lineTo(x - r / 2, y - r);
    ctx.stroke();
    ctx.restore();
  });
}

export function king({ x, y, radius: r, draw, circle, ellipse, fillStyle }: ChessPieceProps) {
  draw((ctx: CanvasRenderingContext2D) => base({ ctx, fillStyle, x, y, radius: r }));

  ellipse({
    x,
    y,
    rY: r,
    rX: r / 0.75,
    rotation: Math.PI,
    fillStyle,
  });

  draw((ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.fillStyle = fillStyle;
    ctx.globalCompositeOperation = "destination-out";
    circle({ x, y: y - r / 2, radius: r / 1.75, fillStyle, lineWidth: r / 10 });
    ctx.restore();
    circle({ x, y: y - r / 1.5, radius: r / 3, fillStyle });
    ctx.fillStyle = fillStyle;
    ctx.fillRect(x - r / 16, y - 1.5 * r, r / 8, r / 2);
    ctx.fillRect(x - r / 4, y - 1.3 * r, r / 2, r / 8);
  });
}

export function squareToAlgebraic(square: Square): string {
  const file = String.fromCharCode(97 + square.col); // 'a' + col
  const rank = 8 - square.row; // Convert from 0-based row to chess rank
  return `${file}${rank}`;
}

export function getPieceSymbol(piece: ChessPiece): string {
  switch (piece.type) {
    case "king":
      return "🨀";
    case "queen":
      return "🨁";
    case "rook":
      return "🨂";
    case "bishop":
      return "🨃";
    case "knight":
      return "🨄";
    case "pawn":
      return "&nbsp;"; // Pawns have no symbol in algebraic notation
  }
}

export function getMoveNotation(
  piece: ChessPiece,
  from: Square,
  to: Square,
  captured: boolean,
  pieces: ChessPiece[],
  gameState?: GameState
): string {
  // Handle castling
  if (piece.type === "king" && isCastlingMove(from, to)) {
    return to.col === 6 ? "O-O" : "O-O-O"; // Kingside or queenside castling
  }

  // Handle en passant
  if (piece.type === "pawn" && isEnPassantMove(piece, from, to, gameState)) {
    const fromFile = String.fromCharCode(97 + from.col);
    const toSquare = squareToAlgebraic(to);
    return `${fromFile}x${toSquare}`;
  }

  const pieceSymbol = getPieceSymbol(piece);
  const toSquare = squareToAlgebraic(to);

  // Handle pawn moves
  if (piece.type === "pawn") {
    if (captured) {
      // Pawn captures use the file letter of the starting square
      const fromFile = String.fromCharCode(97 + from.col);
      return `${fromFile}x${toSquare}`;
    }
    return toSquare;
  }

  // For other pieces, check if disambiguation is needed
  let disambiguation = "";

  // Find all pieces of the same type and color that could move to the same square
  const samePieces = pieces.filter((p) => p.type === piece.type && p.color === piece.color && p !== piece);

  const ambiguousPieces = samePieces.filter((p) => {
    const possibleMoves = calculatePossibleMoves(pieces, p, gameState);
    return possibleMoves.some((move) => move.row === to.row && move.col === to.col);
  });

  if (ambiguousPieces.length > 0) {
    // Need to disambiguate
    const sameFile = ambiguousPieces.some((p) => p.position.col === from.col);
    const sameRank = ambiguousPieces.some((p) => p.position.row === from.row);

    if (!sameFile) {
      // File is unique, use file to disambiguate
      disambiguation = String.fromCharCode(97 + from.col);
    } else if (!sameRank) {
      // Rank is unique, use rank to disambiguate
      disambiguation = String(8 - from.row);
    } else {
      // Both file and rank are needed (rare case)
      disambiguation = squareToAlgebraic(from);
    }
  }

  const captureSymbol = captured ? "(x)" : "";

  console.log(pieceSymbol, disambiguation, captureSymbol, toSquare);

  return `${pieceSymbol}${disambiguation}${captureSymbol}${toSquare}`;
}

export function drawPieces({ clear, normalize, draw, size: s, circle, ellipse, pieces }: any) {
  const shared = (col: typeof WHITE | typeof BLACK) => ({ draw, ellipse, circle, fillStyle: col });

  clear();
  normalize();

  if (!pieces) return;

  // Draw each piece based on board state
  for (const piece of pieces) {
    const x = piece.position.col * s + s / 2;
    const y = piece.position.row * s + s / 3;
    const radius = s / 5;
    const fillStyle = piece.color === "white" ? WHITE : BLACK;

    const props = { x, y, radius, ...shared(fillStyle) };

    switch (piece.type) {
      case "pawn":
        pawn(props);
        break;
      case "rook":
        rook(props);
        break;
      case "knight":
        knight(props);
        break;
      case "bishop":
        bishop(props);
        break;
      case "queen":
        queen(props);
        break;
      case "king":
        king(props);
        break;
    }
  }
}
