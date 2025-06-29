let stack: any = [];

export function preloadImages(array: string[]) {
  for (var i = 0; i < array.length; i++) {
    var img = new Image();
    img.onload = function () {
      const index = stack.indexOf(this);
      if (index !== -1) stack.splice(index, 1);
    };
    stack.push(img);
    img.src = array[i];
  }
}