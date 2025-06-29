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