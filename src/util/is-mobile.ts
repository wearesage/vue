import { isTouchDevice } from "./is-touch-device";

export function isMobile() {
  return isTouchDevice();
}