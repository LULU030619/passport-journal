/**
 * /api/stylize —— AI 图生图的代理层
 *
 * 存在的唯一理由：把 API 密钥留在服务端。
 * 前端只发照片和 prompt，拿回一张新图，全程看不到密钥。
 *
 * 部署到 Vercel 后在 Project Settings → Environment Variables 里填：
 *   AI_API_KEY   模型服务的密钥
 *   AI_ENDPOINT  图生图接口地址
 *   AI_MODEL     模型名
 *
 * 没填的话这个接口返回 501，前端会自动把 AI 那一步隐藏掉，
 * 其余功能照常用。
 */

export const config = { runtime: "nodejs", maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "只接受 POST" });
    return;
  }

  const { AI_API_KEY, AI_ENDPOINT, AI_MODEL } = process.env;
  if (!AI_API_KEY || !AI_ENDPOINT) {
    res.status(501).json({ error: "AI 服务未配置" });
    return;
  }

  const { image, prompt } = req.body || {};
  if (!image || !prompt) {
    res.status(400).json({ error: "缺少 image 或 prompt" });
    return;
  }

  try {
    const upstream = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        prompt,
        image,
        response_format: "b64_json",
        size: "1024x1024",
      }),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      res.status(502).json({ error: `模型服务返回 ${upstream.status}: ${text.slice(0, 200)}` });
      return;
    }

    const data = await upstream.json();

    // 各家返回结构不一样，这里把常见的几种都兜住
    const b64 =
      data?.data?.[0]?.b64_json ||
      data?.data?.[0]?.url ||
      data?.images?.[0] ||
      data?.image;

    if (!b64) {
      res.status(502).json({ error: "模型服务没有返回图片" });
      return;
    }

    const image_out = b64.startsWith("http") || b64.startsWith("data:")
      ? b64
      : `data:image/png;base64,${b64}`;

    res.status(200).json({ image: image_out });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err).slice(0, 200) });
  }
}
