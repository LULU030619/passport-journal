import { blobToDataUrl, dataUrlToBlob } from "./image";

/**
 * AI 风格化走自己的 /api/stylize，不在前端直连模型服务——
 * 密钥一旦写进前端代码，等于公开。
 * 本地 npm run dev 时没有这个接口，界面会提示「未配置」，功能自动隐藏。
 */

export const PRESETS = [
  { key: "pixel", label: "像素风", prompt: "转换成 16-bit 像素画风格，保留主体轮廓和配色，干净的色块，无文字" },
  { key: "ink", label: "水墨", prompt: "转换成中国水墨画风格，留白，淡墨渲染，保留主体形态，无文字" },
  { key: "watercolor", label: "水彩", prompt: "转换成手绘水彩速写风格，笔触柔和，纸张质感，无文字" },
  { key: "cutout", label: "去背景", prompt: "去掉背景，只保留主体，背景填充为纯净的浅米色" },
];

export async function stylize(blob, prompt) {
  const dataUrl = await blobToDataUrl(blob);
  const res = await fetch("/api/stylize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: dataUrl, prompt }),
  });

  if (res.status === 501) {
    throw new Error("这台机器还没配置 AI 服务，先跳过这一步");
  }
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg?.slice(0, 120) || "生成失败，稍后再试");
  }

  const data = await res.json();
  if (!data.image) throw new Error("生成失败，没有拿到图片");
  return dataUrlToBlob(data.image);
}
