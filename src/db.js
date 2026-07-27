import Dexie from "dexie";

/**
 * 数据模型说明
 *
 * 分类（categories）是**全局**的，不挂在某个地点下。
 * 原始需求文档里把 category 挂在 locationId 上，那样每到一个新地方
 * 就要重建一次「人物」「食物」，自定义分类也带不过去。这里改成
 * 分类全局唯一，由 entry 同时关联 placeId + categoryKey。
 *
 * person.placeIds 也没有存成字段——它可以从 entries 推导出来，
 * 存冗余字段迟早会和真实数据对不上。
 */

export const db = new Dexie("passport-journal");

db.version(1).stores({
  places: "id, name, order, arrivedOn",
  entries: "id, placeId, categoryKey, personId, name, createdAt",
  persons: "id, name",
  categories: "key, order",
  meta: "key",
});

export const DEFAULT_CATEGORIES = [
  { key: "person", name: "人物", en: "People", icon: "☺", order: 0, isDefault: 1 },
  { key: "object", name: "物件", en: "Things", icon: "✦", order: 1, isDefault: 1 },
  { key: "food", name: "食物", en: "Food", icon: "◒", order: 2, isDefault: 1 },
];

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/* ------------------------------------------------------------------ */
/* 读取                                                                */
/* ------------------------------------------------------------------ */

export async function getProfile() {
  const row = await db.meta.get("profile");
  return (
    row?.value ?? {
      name: "",
      nameEn: "",
      nationality: "",
      birthPlace: "",
      since: new Date().toISOString().slice(0, 10),
      portrait: null,
    }
  );
}

export async function saveProfile(profile) {
  await db.meta.put({ key: "profile", value: profile });
}

export async function listPlaces() {
  const rows = await db.places.toArray();
  return rows.sort(
    (a, b) => (a.arrivedOn || "").localeCompare(b.arrivedOn || "") || a.order - b.order
  );
}

/* ------------------------------------------------------------------ */
/* 写入                                                                */
/* ------------------------------------------------------------------ */

export async function addPlace({ name, en, country, countryCode, lat, lng, arrivedOn }) {
  const count = await db.places.count();
  const place = {
    id: uid(),
    name,
    en: en || "",
    country: country || "",
    countryCode: countryCode || "",
    lat: typeof lat === "number" ? lat : null,
    lng: typeof lng === "number" ? lng : null,
    arrivedOn: arrivedOn || new Date().toISOString().slice(0, 10),
    order: count,
    createdAt: Date.now(),
  };
  await db.places.add(place);
  return place;
}

export async function updatePlace(id, patch) {
  await db.places.update(id, patch);
}

export async function deletePlace(id) {
  await db.transaction("rw", db.places, db.entries, async () => {
    await db.entries.where("placeId").equals(id).delete();
    await db.places.delete(id);
  });
  await pruneOrphanPersons();
}

export async function addEntry({
  placeId,
  categoryKey,
  name,
  photo,
  note,
  date,
  personId,
}) {
  const entry = {
    id: uid(),
    placeId,
    categoryKey,
    name: (name || "").trim(),
    photo: photo || null,
    note: (note || "").trim(),
    date: date || "",
    personId: personId || null,
    createdAt: Date.now(),
  };
  await db.entries.add(entry);
  return entry;
}

export async function updateEntry(id, patch) {
  await db.entries.update(id, patch);
}

export async function deleteEntry(id) {
  await db.entries.delete(id);
  await pruneOrphanPersons();
}

/* ------------------------------------------------------------------ */
/* 人物                                                                */
/* ------------------------------------------------------------------ */

/** 找同名的人。识别用手动确认，不做自动照片比对——误判比漏判更难解释。 */
export async function findPersonsByName(name) {
  const key = (name || "").trim();
  if (!key) return [];
  return db.persons.where("name").equals(key).toArray();
}

export async function createPerson({ name, avatar }) {
  const person = {
    id: uid(),
    name: (name || "").trim(),
    avatar: avatar || null,
    createdAt: Date.now(),
  };
  await db.persons.add(person);
  return person;
}

/** 删掉不再被任何条目引用的人物记录。 */
async function pruneOrphanPersons() {
  const persons = await db.persons.toArray();
  for (const p of persons) {
    const n = await db.entries.where("personId").equals(p.id).count();
    if (n === 0) await db.persons.delete(p.id);
  }
}

/** 某个人出现过的地点，按时间排。 */
export async function personTrail(personId) {
  const entries = await db.entries.where("personId").equals(personId).toArray();
  const places = await db.places.toArray();
  const byId = new Map(places.map((p) => [p.id, p]));
  return entries
    .map((e) => ({ entry: e, place: byId.get(e.placeId) }))
    .filter((x) => x.place)
    .sort((a, b) => {
      const da = a.entry.date || a.place.arrivedOn || "";
      const dbb = b.entry.date || b.place.arrivedOn || "";
      return da.localeCompare(dbb) || a.entry.createdAt - b.entry.createdAt;
    });
}

/* ------------------------------------------------------------------ */
/* 初始化                                                              */
/* ------------------------------------------------------------------ */

/** 新建一个自定义分类。分类是全局的，建一次所有地点都有。 */
export async function addCategory({ name, icon }) {
  const all = await db.categories.toArray();
  const cat = {
    key: uid(),
    name: (name || "").trim(),
    en: "",
    icon: icon || "◇",
    order: all.length,
    isDefault: 0,
  };
  await db.categories.add(cat);
  return cat;
}

/**
 * 删分类。只允许删空的自定义分类——
 * 里面还有记录就直接删掉，用户会丢东西且不知道丢了什么。
 */
export async function deleteCategory(key) {
  const cat = await db.categories.get(key);
  if (!cat || cat.isDefault) throw new Error("预置分类不能删除");
  const n = await db.entries.where("categoryKey").equals(key).count();
  if (n > 0) throw new Error(`「${cat.name}」里还有 ${n} 条记录，先清空再删`);
  await db.categories.delete(key);
}

export async function ensureCategories() {
  const n = await db.categories.count();
  if (n === 0) await db.categories.bulkAdd(DEFAULT_CATEGORIES);
}
