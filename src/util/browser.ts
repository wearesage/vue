export function detectFullscreen() {
  const d: any = document.documentElement;
  return !!(d.requestFullscreen || d.webkitRequestFullscreen || d.mozRequestFullScreen || d.msRequestFullscreen);
}

export function requestFullscreen(element: any = document.body) {
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.webkitRequestFullscreen) {
    // Safari
    element.webkitRequestFullscreen();
  } else if (element.mozRequestFullScreen) {
    // Firefox
    element.mozRequestFullScreen();
  } else if (element.msRequestFullscreen) {
    // IE/Edge
    element.msRequestFullscreen();
  } else {
    console.warn('Fullscreen API is not supported.');
  }
}

export function exitFullscreen() {
  document.exitFullscreen();
}
