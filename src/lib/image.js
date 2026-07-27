/** 照片一律存成 Blob，不存 base64——base64 会让体积涨三分之一。 */

export function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ img, revoke: () => URL.revokeObjectURL(url) });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("这张图片打不开，换一张试试"));
    };
    img.src = url;
  });
}

/**
 * 按用户拖拽/缩放的结果，把图片裁成正方形。
 * scale = 1 表示图片的短边正好铺满取景框。
 */
export function cropToSquare(img, { scale, offsetX, offsetY, size = 900 }) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#e6ebe2";
  ctx.fillRect(0, 0, size, size);

  const short = Math.min(img.naturalWidth, img.naturalHeight);
  const drawn = short * scale;
  const ratio = size / drawn;
  const w = img.naturalWidth * ratio;
  const h = img.naturalHeight * ratio;
  const x = (size - w) / 2 + offsetX * ratio;
  const y = (size - h) / 2 + offsetY * ratio;

  ctx.drawImage(img, x, y, w, h);
  return canvasToBlob(canvas, 0.86);
}

export function canvasToBlob(canvas, quality = 0.86) {
  return new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", quality)
  );
}

export async function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

export async function dataUrlToBlob(dataUrl) {
  const res = await fetch(dataUrl);
  return res.blob();
}

/** 给 <img> 用的临时地址。组件卸载时记得 revoke，否则内存会一直涨。 */
export function objectUrl(blob) {
  return blob ? URL.createObjectURL(blob) : null;
}
