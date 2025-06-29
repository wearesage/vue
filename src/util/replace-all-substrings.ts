export function replaceAllSubstrings(
  str: string,
  substring: string,
  newValue = ""
) {
  return str.split(substring).join(newValue);
}