import { capitalizeFirstLetter } from "./capitalize-first-letter";

export function snakeToLabel(str: any) {
  if (str === '_id') return 'ID'
  const split = str.split("_");
  if (split.length === 0) return capitalizeFirstLetter(split);
  return split.map(capitalizeFirstLetter).join(" ");
}