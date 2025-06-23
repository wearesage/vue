type XY = [number, number];

export interface Coord2D extends XY {
  x: number;
  y: number;
}

export function coord(x: number, y: number): Coord2D {
  const arr: any = [x, y];
  arr.x = x;
  arr.y = y;
  return arr as Coord2D;
}
