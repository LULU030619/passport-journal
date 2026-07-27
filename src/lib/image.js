/** 照片一律存成 Blob，不存 base64——base64 会让体积涨三分之一。 */

/**
 * 手机相册里的照片有两个坑：
 *   1. iPhone 默认拍 HEIC，很多浏览器解不了
 *   2. 现在随便一张就 4000×3000，而 iOS Safari 对画布尺寸有硬限制，
 *      超了会画出空白图或者直接崩
 * 所以选中照片的第一件事就是缩小 + 统一转成 JPEG，
 * 后面的裁剪、AI、存储全都拿这张小的操作。
 */
const MAX_EDGE = 1600;

/** 尽量用 createImageBitmap 解码：支持的格式更多，也不占主线程。 */
async function decode(file) {
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file);
      return { source: bmp, close: () => bmp.close?.() };
    } catch {
      /* 解不了就退回 <img> */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("decode-failed"));
      i.src = url;
    });
    return { source: img, close: () => URL.revokeObjectURL(url) };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}

/**
 * 选中的文件 → 一张缩小过的、确定能用的 <img>。
 * 返回的 revoke 记得在组件卸载时调用。
 */
export async function prepareImage(file) {
  if (!file || file.size === 0) {
    throw new Error(
      "这个文件是空的。照片如果还存在 iCloud 上，先在相册里下载到本机再试。"
    );
  }

  let decoded;
  try {
    decoded = await decode(file);
  } catch {
    throw new Error(
      "这张照片打不开。iPhone 拍的 HEIC 格式有些浏览器不支持，可以到「设置 → 相机 → 格式」里选「兼容性最佳」，或者换一张试试。"
    );
  }

  const { source, close } = decoded;
  const w0 = source.naturalWidth || source.width;
  const h0 = source.naturalHeight || source.height;

  if (!w0 || !h0) {
    close();
    throw new Error("这张照片读不出尺寸，换一张试试");
  }

  const ratio = Math.min(1, MAX_EDGE / Math.max(w0, h0));
  const w = Math.max(1, Math.round(w0 * ratio));
  const h = Math.max(1, Math.round(h0 * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, w, h);
  close();

  const blob = await canvasToBlob(canvas, 0.92);
  if (!blob || blob.size === 0) {
    throw new Error("照片处理失败，可能是尺寸太大。换一张小一点的试试。");
  }

  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("照片处理失败"));
      i.src = url;
    });
    return { img, revoke: () => URL.revokeObjectURL(url) };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
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
