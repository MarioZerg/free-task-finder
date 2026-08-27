const render = (img: HTMLImageElement, maxSide: number, quality: number) => {
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas_failed');
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', quality);
};

export const prepareJobPhoto = (file: File): Promise<{ thumb: string; full: string }> =>
  new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('not_image'));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read_failed'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('decode_failed'));
      img.onload = () => {
        try {
          resolve({
            thumb: render(img, 720, 0.7),
            full: render(img, 1600, 0.82),
          });
        } catch (e) {
          reject(e as Error);
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
