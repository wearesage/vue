export function writeToClipboard(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!navigator?.clipboard || !window?.ClipboardItem) {
      console.error('Clipboard API not supported or unavailable.');
      return reject('Clipboard API not supported or unavailable.');
    }

    try {
      const blob = new Blob([text], { type: 'text/plain' });
      const clipboardItem = new window.ClipboardItem({ 'text/plain': blob });

      navigator.clipboard
        .write([clipboardItem])
        .then(() => resolve())
        .catch(error => {
          console.error('Failed to write to clipboard:', error);
          reject(error);
        });
    } catch (error) {
      console.error('Error creating clipboard item:', error);
      reject(error);
    }
  });
}
