export function isPWA() {
  return (navigator as any)?.standalone || window.matchMedia("(display-mode: standalone)").matches;
}