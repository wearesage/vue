export function isTouchDevice() {
  return "ontouchstart" in window;
}

export function isMobile() {
  return isTouchDevice();
}

export function isSafari() {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

export function isPWA() {
  return (navigator as any)?.standalone || window.matchMedia("(display-mode: standalone)").matches;
}
