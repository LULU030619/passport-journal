import { db, ensureCategories, saveProfile } from "./db";

/**
 * 首次打开时载入的示例内容。
 *
 * 内容来自作者真实的旅行记录，导出后拆成 public/seed/：
 *   - manifest.json 是元数据（地点、记录、人物，照片字段存的是文件路径）
 *   - 照片是一张张独立的 jpg，按需 fetch，不一次性塞进代码
 * 这样首屏不用背 30MB 的 base64，翻到哪一页才拉那几张图。
 */

async function fetchBlob(path) {
  try {
    const res = await fetch(import.meta.env.BASE_URL + path);
    if (!res.ok) return null;
    return await res.blob();
  } catch {
    return null;
  }
}

export async function seedIfEmpty() {
  await ensureCategories();
  const n = await db.places.count();
  if (n > 0) return false;

  let manifest;
  try {
    const res = await fetch(import.meta.env.BASE_URL + "seed/manifest.json");
    if (!res.ok) return false;
    manifest = await res.json();
  } catch {
    return false;
  }

  // 分类：用备份里的（含自建的「动物」「事件」），覆盖默认三类
  if (manifest.categories?.length) {
    await db.categories.clear();
    await db.categories.bulkAdd(manifest.categories);
  }

  // 资料页
  const prof = { ...manifest.profile };
  prof.portrait = prof.portrait ? await fetchBlob(prof.portrait) : null;
  await saveProfile(prof);

  // 地点
  await db.places.bulkAdd(manifest.places);

  // 人物头像
  const persons = await Promise.all(
    (manifest.persons || []).map(async (p) => ({
      ...p,
      avatar: p.avatar ? await fetchBlob(p.avatar) : null,
    }))
  );
  await db.persons.bulkAdd(persons);

  // 记录照片——数量多，分批拉，避免一次性几百个并发请求
  const entries = manifest.entries || [];
  const out = [];
  const BATCH = 12;
  for (let i = 0; i < entries.length; i += BATCH) {
    const chunk = entries.slice(i, i + BATCH);
    const done = await Promise.all(
      chunk.map(async (e) => ({
        ...e,
        photo: e.photo ? await fetchBlob(e.photo) : null,
      }))
    );
    out.push(...done);
  }
  await db.entries.bulkAdd(out);

  return true;
}
