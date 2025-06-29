export function dropJSON(targetEl: HTMLElement = document.body, callback: any) {
  targetEl.addEventListener('dragenter', function (e) {
    e.preventDefault();
  });

  targetEl.addEventListener('dragover', function (e) {
    e.preventDefault();
  });

  targetEl.addEventListener('drop', function (event: DragEvent) {
    const reader = new FileReader();

    reader.onload = function () {
      callback(JSON.parse(this.result as string));
    };

    if (event.dataTransfer) {
      reader.readAsText(event.dataTransfer.files[0]);
      event.preventDefault();
    }
  });
}