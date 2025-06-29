import { capitalizeFirstLetter } from "./capitalize-first-letter";

export function capitalizeEveryWord(str: string): string {
  if (!str) return str;
  return str.split(" ").map(capitalizeFirstLetter).join(" ");
}