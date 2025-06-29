export function createResizeObserver(element: HTMLElement, callback: ({ width, height }: { width: number; height: number }) => unknown) {
  const observer = new ResizeObserver(([entry]) => {
    const { width, height } = entry.contentRect;
    callback({ width, height });
  });

  observer.observe(element);

  return observer;
}