
export function handleFileUpload(event: any, type: 'text' | 'array-buffer' | 'data-url', parse: boolean = false) {
  return new Promise((resolve, reject) => {
    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e: any) {
      try {
        if (parse) return resolve(JSON.parse(e.target.result));
        resolve(e.target.result);
      } catch (error) {
        console.error('Error parsing JSON:', error);
        reject(error);
      }
    };

    switch (type) {
      case 'text':
        reader.readAsText(file);
        return;
      case 'array-buffer':
        reader.readAsArrayBuffer(file);
        return;
      case 'data-url':
        reader.readAsDataURL(file);
        return;
      default:
        return;
    }
  });
}

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

export function imageToBase64(file: any) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsDataURL(file);
  });
}