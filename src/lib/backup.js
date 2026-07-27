import { db, getProfile, saveProfile } from "../db";
import { blobToDataUrl, dataUrlToBlob } from "./image";

/**
 * 数据只存在浏览器里，清一次缓存就全没了。
 * 所以备份不是「以后再说」的功能，是第一版就必须有的。
 */

const FORMAT = "passport-journal/v1";

export async function exportBackup() {
  const [profile, places, entries, persons, categories] = await Promise.all([
    getProfile(),
    db.places.toArray(),
    db.entries.toArray(),
    db.persons.toArray(),
    db.categories.toArray(),
  ]);

  const packEntries = await Promise.all(
    entries.map(async (e) => ({
      ...e,
      photo: e.photo ? await blobToDataUrl(e.photo) : null,
    }))
  );
  const packPersons = await Promise.all(
    persons.map(async (p) => ({
      ...p,
      avatar: p.avatar ? await blobToDataUrl(p.avatar) : null,
    }))
  );
  const packProfile = {
    ...profile,
    portrait: profile.portrait ? await blobToDataUrl(profile.portrait) : null,
  };

  return {
    format: FORMAT,
    exportedAt: new Date().toISOString(),
    profile: packProfile,
    places,
    entries: packEntries,
    persons: packPersons,
    categories,
  };
}

export async function downloadBackup() {
  const data = await exportBackup();
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `旅行手帐备份-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export async function importBackup(file) {
  const text = await file.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("这个文件不是备份文件");
  }
  if (data.format !== FORMAT) {
    throw new Error("备份文件版本对不上，无法导入");
  }

  const entries = await Promise.all(
    (data.entries || []).map(async (e) => ({
      ...e,
      photo: e.photo ? await dataUrlToBlob(e.photo) : null,
    }))
  );
  const persons = await Promise.all(
    (data.persons || []).map(async (p) => ({
      ...p,
      avatar: p.avatar ? await dataUrlToBlob(p.avatar) : null,
    }))
  );

  await db.transaction(
    "rw",
    db.places,
    db.entries,
    db.persons,
    db.categories,
    db.meta,
    async () => {
      await Promise.all([
        db.places.clear(),
        db.entries.clear(),
        db.persons.clear(),
        db.categories.clear(),
      ]);
      await db.places.bulkAdd(data.places || []);
      await db.entries.bulkAdd(entries);
      await db.persons.bulkAdd(persons);
      await db.categories.bulkAdd(data.categories || []);
    }
  );

  const profile = data.profile || {};
  await saveProfile({
    ...profile,
    portrait: profile.portrait ? await dataUrlToBlob(profile.portrait) : null,
  });
}
