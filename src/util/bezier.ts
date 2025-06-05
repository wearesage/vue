function LinearEasing(x: number) {
  return x;
}

const { cbrt, sqrt, PI: π } = Math;

const x2t = (x: number, a: number, b: number, c: number, d: number) => {
  const q = a + b * x;
  const s = q ** 2 + c;

  if (s > 0) {
    const root = sqrt(s);
    return cbrt(q + root) + cbrt(q - root) - d;
  }

  const l = cbrt(sqrt(q * q - s));
  const angle = q ? Math.atan(sqrt(-s) / q) : -π / 2;
  let φ;

  if (b < 0) {
    φ = (q > 0 ? 2 * π : π) - angle;
  } else if (d < 0) {
    φ = (q > 0 ? 2 * π : -3 * π) + angle;
  } else {
    φ = (q > 0 ? 0 : π) + angle;
  }

  return 2 * l * Math.cos(φ / 3) - d;
};

const Y = (t: number, ay: number, by: number, cy: number) => ((ay * t + 3 * by) * t + cy) * t;

export default function bezier(mX1: number, mY1: number, mX2: number, mY2: number) {
  if (!(0 <= mX1 && mX1 <= 1 && 0 <= mX2 && mX2 <= 1)) {
    throw new Error('Bezier x values must be in [0, 1] range');
  }

  if (mX1 === mY1 && mX2 === mY2) return LinearEasing;

  const a = 6 * (3 * mX1 - 3 * mX2 + 1);
  const b = 6 * (mX2 - 2 * mX1);
  const c = 3 * mX1;
  const a2 = a * a;
  const b2 = b * b;
  const d = b / a;
  const e = (3 * b * c) / a2 - (b2 * b) / (a2 * a);
  const w1 = (2 * c) / a - b2 / a2;
  const w = w1 * w1 * w1;
  const o = 3 / a;
  const ay = 3 * mY1 - 3 * mY2 + 1;
  const by = mY2 - 2 * mY1;
  const cy = 3 * mY1;

  const X2T = a ? x2t : LinearEasing;

  return (x: number) => {
    if (x === 0 || x === 1) return x;

    return Y(X2T(x, e, o, w, d), ay, by, cy);
  };
}
