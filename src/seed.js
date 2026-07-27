import { addEntry, addPlace, createPerson, db, ensureCategories, saveProfile } from "./db";
import { canvasToBlob } from "./lib/image";

/**
 * 第一次打开时放进去的示例内容。
 *
 * 照片是代码画出来的占位图，不是真照片——刻意做成抽象色块而不是
 * 假装成风景照，免得让人以为这是真的记录。设置页里清空一次就干净了。
 */

const PALETTES = [
  ["#5c1f2b", "#a33327"],
  ["#2c5680", "#5a7fa3"],
  ["#2e6b4c", "#6b9c7e"],
  ["#5a3b6b", "#8b6b9c"],
  ["#7a5a2b", "#b89b5e"],
  ["#3a4a52", "#7b8f99"],
];

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

async function placeholder(label) {
  const size = 720;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  const [a, b] = PALETTES[hash(label) % PALETTES.length];

  const g = ctx.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  // 细网格，跟证件纸的底纹呼应
  ctx.strokeStyle = "rgba(255,255,255,0.09)";
  ctx.lineWidth = 1;
  for (let i = size / 12; i < size; i += size / 12) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = `600 ${size * 0.34}px "Songti SC", Georgia, serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label.slice(0, 1), size / 2, size / 2 - size * 0.02);

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = `500 ${size * 0.035}px ui-monospace, monospace`;
  ctx.fillText("示 例 图 片", size / 2, size * 0.84);

  return canvasToBlob(c, 0.88);
}

export async function seedIfEmpty() {
  await ensureCategories();
  const n = await db.places.count();
  if (n > 0) return false;

  await saveProfile({
    name: "旅行者",
    nameEn: "TRAVELLER",
    nationality: "中国 CHN",
    birthPlace: "—",
    since: "2026-05-12",
    portrait: await placeholder("旅"),
  });

  const shanghai = await addPlace({
    name: "上海",
    en: "Shanghai",
    country: "中国",
    countryCode: "CN",
    lat: 31.2304,
    lng: 121.4737,
    arrivedOn: "2026-05-12",
  });
  const rome = await addPlace({
    name: "罗马",
    en: "Rome",
    country: "意大利",
    countryCode: "IT",
    lat: 41.9028,
    lng: 12.4964,
    arrivedOn: "2026-06-20",
  });
  const cph = await addPlace({
    name: "哥本哈根",
    en: "Copenhagen",
    country: "丹麦",
    countryCode: "DK",
    lat: 55.6761,
    lng: 12.5683,
    arrivedOn: "2026-07-02",
  });

  // 同一个人出现在两地 —— 轨迹功能靠这条示例才看得出来
  const ming = await createPerson({ name: "小明", avatar: await placeholder("小明") });

  await addEntry({
    placeId: shanghai.id,
    categoryKey: "person",
    name: "小明",
    photo: await placeholder("小明"),
    note: "在外滩排队等轮渡的时候认识的，他说他也是一个人来。",
    date: "2026-05-13",
    personId: ming.id,
  });
  await addEntry({
    placeId: shanghai.id,
    categoryKey: "food",
    name: "小笼包",
    photo: await placeholder("包"),
    note: "第一口烫到了。第二口开始学会先咬个小洞。",
    date: "2026-05-13",
  });
  await addEntry({
    placeId: shanghai.id,
    categoryKey: "object",
    name: "地铁单程票",
    photo: await placeholder("票"),
    note: "出站的时候忘了它要回收，被闸机吞掉之前拍的。",
    date: "2026-05-14",
  });

  await addEntry({
    placeId: rome.id,
    categoryKey: "person",
    name: "小明",
    photo: await placeholder("小明"),
    note: "在许愿池边上又碰到了。世界真的很小。",
    date: "2026-06-21",
    personId: ming.id,
  });
  await addEntry({
    placeId: rome.id,
    categoryKey: "food",
    name: "提拉米苏",
    photo: await placeholder("提"),
    note: "在一家没有招牌的店里吃的，老板说这是他外婆的方子。",
    date: "2026-06-22",
  });

  await addEntry({
    placeId: cph.id,
    categoryKey: "object",
    name: "黑胶唱片",
    photo: await placeholder("碟"),
    note: "在一家听音酒吧买的，店员放了一整面才让我决定。",
    date: "2026-07-03",
  });

  return true;
}
