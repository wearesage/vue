export function toPrecision(value: number, decimalPlaces = 5) {
  return parseFloat(value.toFixed(decimalPlaces));
}
