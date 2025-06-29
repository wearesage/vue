export function loadExternalScript(src: string) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script') as HTMLScriptElement;
    script.onload = () => resolve(true);
    script.onerror = () => reject();
    script.src = src;
    document.body.appendChild(script);
  });
}