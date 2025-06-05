import areaCodeMap from "../data/utility/usa.area-code-map.json";

export function getStateFromAreaCode(code: number) {
  return (areaCodeMap as any)[code];
}
