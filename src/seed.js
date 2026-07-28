import { db, ensureCategories, saveProfile } from "./db";

/**
 * 首次打开时载入的示例内容（作者真实旅行记录）。
 *
 * 分两段加载，避免首屏干等：
 *   第一段 seedCore —— 写入地点/人物/资料/记录的「文字」部分（含照片文件路径），
 *                       很快，护照结构立刻能翻。
 *   第二段 hydratePhotos —— 在后台把照片一张张 fetch 成 Blob 塞回去，
 *                       翻到哪页那几张自然就显示了（useLiveQuery 会自动刷新）。
 */

function base(path) {
  return import.meta.env.BASE_URL + path;
}

async function fetchBlob(path) {
  try {
    const res = await fetch(base(path));
    if (!res.ok) return null;
    return await res.blob();
  } catch {
    return null;
  }
}

/** 第一段：只写文字元数据，秒级完成。返回 manifest 供第二段用。 */
export async function seedCore() {
  await ensureCategories();
  const n = await db.places.count();
  if (n > 0) return { seeded: false };

  let manifest;
  try {
    const res = await fetch(base("seed/manifest.json"));
    if (!res.ok) return { seeded: false };
    manifest = await res.json();
  } catch {
    return { seeded: false };
  }

  if (manifest.categories?.length) {
    await db.categories.clear();
    await db.categories.bulkAdd(manifest.categories);
  }

  // 资料页：照片路径先留着，第二段再换成 Blob
  await saveProfile({ ...manifest.profile, portrait: null });
  await db.places.bulkAdd(manifest.places);
  await db.persons.bulkAdd(
    (manifest.persons || []).map((p) => ({ ...p, avatar: null }))
  );
  await db.entries.bulkAdd(
    (manifest.entries || []).map((e) => ({ ...e, photo: null }))
  );

  return { seeded: true, manifest };
}

/** 第二段：后台把照片补上。分批，避免几百个并发请求。 */
export async function hydratePhotos(manifest, onProgress) {
  if (!manifest) return;

  const jobs = [];
  if (manifest.profile?.portrait) {
    jobs.push(async () => {
      const blob = await fetchBlob(manifest.profile.portrait);
      if (blob) {
        const prof = await db.meta.get("profile");
        await saveProfile({ ...(prof?.value || {}), portrait: blob });
      }
    });
  }
  for (const p of manifest.persons || []) {
    if (p.avatar)
      jobs.push(async () => {
        const blob = await fetchBlob(p.avatar);
        if (blob) await db.persons.update(p.id, { avatar: blob });
      });
  }
  for (const e of manifest.entries || []) {
    if (e.photo)
      jobs.push(async () => {
        const blob = await fetchBlob(e.photo);
        if (blob) await db.entries.update(e.id, { photo: blob });
      });
  }

  const total = jobs.length;
  let done = 0;
  const BATCH = 10;
  for (let i = 0; i < jobs.length; i += BATCH) {
    await Promise.all(
      jobs.slice(i, i + BATCH).map((j) =>
        j().then(() => {
          done++;
          onProgress?.(done, total);
        })
      )
    );
  }
}

/** 兼容旧调用：一次性全做完（现在 App 不用它了，保留以防万一）。 */
export async function seedIfEmpty() {
  const { seeded, manifest } = await seedCore();
  if (seeded) await hydratePhotos(manifest);
  return seeded;
}
