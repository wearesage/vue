export function replaceAllWords(str: string, substring: string, newValue = "") {
  const regex = new RegExp(`(?<!\\.)\\b${substring}\\b`, "g");
  return str.replace(regex, newValue);
}