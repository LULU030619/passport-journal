import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";

import { db, getProfile, listPlaces, deletePlace, deleteCategory } from "./db";
import { seedIfEmpty } from "./seed";

import Pager from "./components/Pager";
import Stamp from "./components/Stamp";
import Photo from "./components/Photo";
import MapPage from "./components/MapPage";
import AddPlaceSheet from "./components/AddPlaceSheet";
import AddEntrySheet from "./components/AddEntrySheet";
import AddCategorySheet from "./components/AddCategorySheet";
import EntrySheet from "./components/EntrySheet";
import PersonSheet from "./components/PersonSheet";
import ProfileSheet from "./components/ProfileSheet";
import SettingsSheet from "./components/SettingsSheet";

/* ================================================================== */
/* 封面                                                                */
/* ================================================================== */

function Cover({ onOpen, opening, count }) {
  return (
    <div
      className={`cover${opening ? " cover--opening" : ""}`}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen()}
    >
      <svg className="cover__crest" viewBox="0 0 100 100" aria-hidden="true">
        <g fill="none" stroke="currentColor" strokeWidth="1.4">
          <circle cx="50" cy="50" r="30" />
          <ellipse cx="50" cy="50" rx="13" ry="30" />
          <path d="M20 50h60M25 34h50M25 66h50" />
        </g>
        <path
          d="M50 12 L53 20 L61 20 L55 25 L57 33 L50 28 L43 33 L45 25 L39 20 L47 20 Z"
          fill="currentColor"
          opacity="0.9"
        />
      </svg>

      <div>
        <h1 className="cover__title">旅行手帐</h1>
        <p className="cover__sub" style={{ marginTop: 12 }}>
          Passport Journal
        </p>
      </div>

      <p className="cover__sub" style={{ opacity: 0.7 }}>
        {count > 0 ? `${count} 枚入境章` : "还没有盖章"}
      </p>

      <span className="cover__hint">轻触翻开</span>
    </div>
  );
}

/* ================================================================== */
/* 资料页                                                              */
/* ================================================================== */

function mrz(profile, placeCount) {
  const pad = (s, n) => (s || "").toUpperCase().replace(/[^A-Z0-9]/g, "<").padEnd(n, "<").slice(0, n);
  const l1 = `P<CHN${pad(profile.nameEn || profile.name || "TRAVELLER", 30)}`;
  const l2 = `${pad(String(placeCount).padStart(4, "0"), 9)}CHN${pad(
    (profile.since || "").replace(/-/g, "").slice(2),
    7
  )}`;
  return [l1.slice(0, 38), l2.slice(0, 38)];
}

function DataPage({ profile, places, entries, onEdit, onSettings }) {
  const countries = new Set(places.map((p) => p.country).filter(Boolean));
  const [l1, l2] = mrz(profile, places.length);

  return (
    <div className="page">
      <div className="guilloche" />
      <div className="page__body">
        <p className="eyebrow">Passport Journal · 旅行手帐</p>

        <div className="data-head">
          <Photo
            blob={profile.portrait}
            className="portrait"
            alt=""
            fallback={<div className="portrait portrait--empty">还没有照片</div>}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <span className="field-label">姓名 / Name</span>
            <p className="field-value" style={{ fontSize: 21 }}>
              {profile.name || "（未填写）"}
            </p>
            <p
              className="field-value"
              style={{ fontFamily: "var(--f-mono)", fontSize: 11, letterSpacing: "0.13em", marginTop: 4, color: "var(--ink-soft)" }}
            >
              {(profile.nameEn || "").toUpperCase()}
            </p>
          </div>
        </div>

        <div className="data-grid">
          <div>
            <span className="field-label">国籍 / Nationality</span>
            <p className="field-value">{profile.nationality || "—"}</p>
          </div>
          <div>
            <span className="field-label">出生地 / Place of birth</span>
            <p className="field-value">{profile.birthPlace || "—"}</p>
          </div>
          <div>
            <span className="field-label">签发日期 / Since</span>
            <p className="field-value">{profile.since || "—"}</p>
          </div>
          <div>
            <span className="field-label">章数 / Stamps</span>
            <p className="field-value">{places.length}</p>
          </div>
          <div className="span-2">
            <span className="field-label">足迹 / Footprint</span>
            <p className="field-value">
              {countries.size} 个国家 · {places.length} 个地方 · {entries.length} 条记录
            </p>
          </div>
        </div>

        <div className="mrz">
          {l1}
          <br />
          {l2}
        </div>

        <div className="row" style={{ marginTop: 24 }}>
          <button className="btn btn--ghost" onClick={onEdit}>
            编辑资料
          </button>
          <button className="btn btn--ghost" onClick={onSettings}>
            备份
          </button>
        </div>

        <p className="muted" style={{ marginTop: 22 }}>
          向左滑动翻页。
        </p>
      </div>
    </div>
  );
}

/* ================================================================== */
/* 目录页（含全局搜索）                                                */
/* ================================================================== */

function ContentsPage({
  places,
  entries,
  categories,
  onJump,
  onAddPlace,
  onOpenEntry,
  onOpenCollection,
  onAddCategory,
}) {
  const [q, setQ] = useState("");
  const key = q.trim().toLowerCase();

  const catName = (k) => categories.find((c) => c.key === k)?.name || "";
  const placeName = (id) => places.find((p) => p.id === id)?.name || "";

  const hitEntries = key
    ? entries.filter(
        (e) =>
          e.name.toLowerCase().includes(key) ||
          e.note.toLowerCase().includes(key)
      )
    : [];
  const hitPlaces = key
    ? places.filter((p) => p.name.toLowerCase().includes(key) || (p.country || "").includes(key))
    : places;

  return (
    <div className="page">
      <div className="guilloche" />
      <div className="page__body">
        <p className="eyebrow">目录 / Contents</p>
        <h2 className="page-title">去过的地方</h2>

        <input
          className="input"
          style={{ marginTop: 18 }}
          placeholder="搜地点、人名、备注…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <div style={{ marginTop: 16 }}>
          {hitPlaces.map((p, i) => (
            <button key={p.id} className="toc-item" onClick={() => onJump(p.id)}>
              <span className="toc-item__no">
                {String(places.indexOf(p) + 1).padStart(2, "0")}
              </span>
              <span className="toc-item__name">{p.name}</span>
              <span className="toc-item__meta">{p.arrivedOn}</span>
            </button>
          ))}
        </div>

        {key && hitEntries.length > 0 && (
          <>
            <p className="eyebrow" style={{ marginTop: 26 }}>
              记录里的 {hitEntries.length} 条
            </p>
            {hitEntries.map((e) => (
              <button key={e.id} className="trail-item" onClick={() => onOpenEntry(e)}>
                <Photo
                  blob={e.photo}
                  className="trail-item__thumb"
                  alt=""
                  fallback={<div className="trail-item__thumb" />}
                />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontFamily: "var(--f-serif)", fontSize: 15, display: "block" }}>
                    {e.name || "（没写名字）"}
                  </span>
                  <span className="muted" style={{ fontSize: 11.5 }}>
                    {placeName(e.placeId)} · {catName(e.categoryKey)}
                  </span>
                </span>
              </button>
            ))}
          </>
        )}

        {key && hitPlaces.length === 0 && hitEntries.length === 0 && (
          <div className="empty" style={{ marginTop: 18 }}>
            没有找到「{q.trim()}」
          </div>
        )}

        <div style={{ marginTop: 26 }}>
          <button className="btn btn--solid btn--block" onClick={onAddPlace}>
            + 去了新的地方
          </button>
        </div>

        <hr className="hairline" style={{ marginTop: 34 }} />

        <p className="eyebrow">库 / Collections</p>
        <p className="muted" style={{ marginBottom: 8 }}>
          不分地点，把同一类东西放在一起看。
        </p>

        {categories.map((c) => (
          <button key={c.key} className="toc-item" onClick={() => onOpenCollection(c.key)}>
            <span className="toc-item__no" style={{ fontSize: 13 }}>
              {c.icon || "◇"}
            </span>
            <span className="toc-item__name">{c.name}库</span>
            <span className="toc-item__meta">
              {entries.filter((e) => e.categoryKey === c.key).length}
            </span>
          </button>
        ))}

        <button
          className="btn btn--ghost btn--block"
          style={{ marginTop: 18 }}
          onClick={onAddCategory}
        >
          + 新建一个库
        </button>
      </div>
    </div>
  );
}

/* ================================================================== */
/* 地点页                                                              */
/* ================================================================== */

function PlacePage({ place, entries, categories, onAdd, onOpenEntry, onDelete, onAddCategory }) {
  const [tab, setTab] = useState(categories[0]?.key || "person");

  // 分类被删掉之后，当前标签可能指向一个不存在的库
  useEffect(() => {
    if (categories.length && !categories.some((c) => c.key === tab)) {
      setTab(categories[0].key);
    }
  }, [categories, tab]);
  const mine = entries.filter((e) => e.placeId === place.id);
  const shown = mine.filter((e) => e.categoryKey === tab);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="page">
      <div className="guilloche" />
      <div className="page__body">
        <div className="stamp-slot">
          <Stamp
            id={place.id}
            city={place.en || place.name}
            country={place.country}
            date={place.arrivedOn}
          />
        </div>

        <p className="eyebrow">
          {place.country || "—"} {place.countryCode ? `· ${place.countryCode}` : ""}
        </p>
        <h2 className="page-title">{place.name}</h2>
        <p className="muted" style={{ marginTop: 6 }}>
          {mine.length} 条记录
        </p>

        <div className="tabs">
          {categories.map((c) => {
            const n = mine.filter((e) => e.categoryKey === c.key).length;
            return (
              <button
                key={c.key}
                className={`tab${tab === c.key ? " tab--on" : ""}`}
                onClick={() => setTab(c.key)}
              >
                {c.name} {n > 0 ? n : ""}
              </button>
            );
          })}
          <button className="tab tab--add" onClick={onAddCategory} aria-label="新建一个库">
            ＋
          </button>
        </div>

        {shown.length === 0 ? (
          <div className="empty">
            这一类还是空的。
            <br />
            记下在这里遇到的第一样东西。
          </div>
        ) : (
          <div className="grid">
            {shown.map((e) => (
              <button key={e.id} className="card" onClick={() => onOpenEntry(e)}>
                <Photo
                  blob={e.photo}
                  className="card__img"
                  alt={e.name}
                  fallback={<div className="card__img" />}
                />
                <p className="card__name">{e.name || "—"}</p>
                {e.note && <p className="card__note">{e.note}</p>}
              </button>
            ))}
          </div>
        )}

        <div style={{ marginTop: 22 }}>
          <button className="btn btn--solid btn--block" onClick={() => onAdd(place, tab)}>
            + 添加到「{categories.find((c) => c.key === tab)?.name}」
          </button>
        </div>

        <hr className="hairline" style={{ marginTop: 30 }} />
        {confirming ? (
          <div className="row">
            <button className="btn btn--ghost" onClick={() => setConfirming(false)}>
              算了
            </button>
            <button
              className="btn"
              style={{ borderColor: "var(--stamp-red)", color: "var(--stamp-red)" }}
              onClick={() => onDelete(place.id)}
            >
              连同 {mine.length} 条记录一起删
            </button>
          </div>
        ) : (
          <button className="btn btn--ghost btn--block" onClick={() => setConfirming(true)}>
            撕掉这一页
          </button>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/* 库页：不按地点、按类型横着看一遍                                     */
/* ================================================================== */

function CollectionsPage({
  entries,
  places,
  categories,
  tab,
  onTabChange,
  onOpenEntry,
  onOpenPerson,
  onAddCategory,
  onDeleteCategory,
}) {
  const setTab = onTabChange;
  const shown = entries.filter((e) => e.categoryKey === tab);
  const currentCat = categories.find((c) => c.key === tab);
  const placeName = (id) => places.find((p) => p.id === id)?.name || "";

  // 人物库按人聚合，一个人只出现一次
  const people = useMemo(() => {
    if (tab !== "person") return null;
    const m = new Map();
    for (const e of shown) {
      const k = e.personId || `anon:${e.id}`;
      if (!m.has(k)) m.set(k, { key: k, personId: e.personId, entry: e, places: new Set() });
      m.get(k).places.add(placeName(e.placeId));
    }
    return [...m.values()];
  }, [tab, shown, places]);

  return (
    <div className="page">
      <div className="guilloche" />
      <div className="page__body">
        <p className="eyebrow">库 / Collections</p>
        <h2 className="page-title">全部收藏</h2>
        <p className="muted" style={{ marginTop: 6 }}>
          不分地点，按类型看一遍。
        </p>

        <div className="tabs">
          {categories.map((c) => (
            <button
              key={c.key}
              className={`tab${tab === c.key ? " tab--on" : ""}`}
              onClick={() => setTab(c.key)}
            >
              {c.name} {entries.filter((e) => e.categoryKey === c.key).length || ""}
            </button>
          ))}
          <button className="tab tab--add" onClick={onAddCategory} aria-label="新建一个库">
            ＋
          </button>
        </div>

        {shown.length === 0 && <div className="empty">这个库还是空的。</div>}

        {tab === "person" && people && people.length > 0 && (
          <div>
            {people.map((p) => (
              <button
                key={p.key}
                className="trail-item"
                onClick={() =>
                  p.personId ? onOpenPerson(p.personId) : onOpenEntry(p.entry)
                }
              >
                <Photo
                  blob={p.entry.photo}
                  className="trail-item__thumb"
                  alt=""
                  fallback={<div className="trail-item__thumb" />}
                />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontFamily: "var(--f-serif)", fontSize: 16, display: "block" }}>
                    {p.entry.name || "（没写名字）"}
                  </span>
                  <span className="muted" style={{ fontSize: 11.5 }}>
                    {[...p.places].join(" → ")}
                  </span>
                </span>
                {p.places.size > 1 && (
                  <span className="toc-item__meta" style={{ color: "var(--stamp-red)" }}>
                    {p.places.size} 地
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {currentCat && !currentCat.isDefault && shown.length === 0 && (
          <button
            className="btn btn--ghost btn--block"
            style={{ marginTop: 18 }}
            onClick={() => onDeleteCategory(currentCat.key)}
          >
            删掉「{currentCat.name}」这个库
          </button>
        )}

        {tab !== "person" && shown.length > 0 && (
          <div className="grid">
            {shown.map((e) => (
              <button key={e.id} className="card" onClick={() => onOpenEntry(e)}>
                <Photo
                  blob={e.photo}
                  className="card__img"
                  alt={e.name}
                  fallback={<div className="card__img" />}
                />
                <p className="card__name">{e.name || "—"}</p>
                <p className="card__note">{placeName(e.placeId)}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/* 地图页                                                              */
/* ================================================================== */

function WorldPage({ places, entries }) {
  const countries = new Set(places.map((p) => p.country).filter(Boolean));
  return (
    <div className="page">
      <div className="guilloche" />
      <div className="page__body">
        <p className="eyebrow">地图 / Map</p>
        <h2 className="page-title">走过的地方</h2>
        <p className="muted" style={{ marginTop: 6, marginBottom: 18 }}>
          {countries.size} 个国家 · {places.length} 个地方 · {entries.length} 条记录
        </p>

        <MapPage places={places} />

        <p className="muted" style={{ marginTop: 18 }}>
          在人物库里点开一个人，可以看到他一个人的轨迹画在这张图上。
        </p>
      </div>
    </div>
  );
}

/* ================================================================== */
/* 主应用                                                              */
/* ================================================================== */

export default function App() {
  const [booted, setBooted] = useState(false);
  const [opened, setOpened] = useState(false);
  const [opening, setOpening] = useState(false);
  const [index, setIndex] = useState(0);
  const [sheet, setSheet] = useState(null);
  const [toast, setToast] = useState("");
  const [pendingJump, setPendingJump] = useState(null);
  const [collectionTab, setCollectionTab] = useState(null);

  useEffect(() => {
    seedIfEmpty().finally(() => setBooted(true));
  }, []);

  const profile = useLiveQuery(() => getProfile(), [], null);
  const places = useLiveQuery(() => listPlaces(), [], []);
  const entries = useLiveQuery(
    () => db.entries.orderBy("createdAt").toArray(),
    [],
    []
  );
  const categories = useLiveQuery(
    () => db.categories.orderBy("order").toArray(),
    [],
    []
  );

  useEffect(() => {
    if (!categories.length) return;
    if (!collectionTab || !categories.some((c) => c.key === collectionTab)) {
      setCollectionTab(categories[0].key);
    }
  }, [categories, collectionTab]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const openCover = () => {
    setOpening(true);
    setTimeout(() => setOpened(true), 560);
  };

  const pages = useMemo(() => {
    const list = [
      { key: "data", label: "资料页" },
      { key: "contents", label: "目录" },
    ];
    places.forEach((p) => list.push({ key: `place:${p.id}`, label: p.name, place: p }));
    list.push({ key: "collections", label: "库" });
    list.push({ key: "map", label: "地图" });
    return list;
  }, [places]);

  useEffect(() => {
    if (index > pages.length - 1) setIndex(Math.max(0, pages.length - 1));
  }, [pages.length, index]);

  // 新加的地点要等数据回来、页面列表重算之后才能跳过去，
  // 直接 setTimeout 跳会因为时机不对而落空。
  useEffect(() => {
    if (!pendingJump) return;
    const i = pages.findIndex((p) => p.key === `place:${pendingJump}`);
    if (i >= 0) {
      setIndex(i);
      setPendingJump(null);
    }
  }, [pendingJump, pages]);

  if (!booted || !profile || !categories.length) {
    return (
      <div className="book">
        <div className="book__inner">
          <div className="empty" style={{ margin: 40, border: 0 }}>
            正在翻开…
          </div>
        </div>
      </div>
    );
  }

  const jumpToPlace = (placeId) => {
    const i = pages.findIndex((p) => p.key === `place:${placeId}`);
    if (i >= 0) setIndex(i);
  };

  const openCollection = (catKey) => {
    setCollectionTab(catKey);
    const i = pages.findIndex((p) => p.key === "collections");
    if (i >= 0) setIndex(i);
  };

  const removeCategory = async (key) => {
    try {
      await deleteCategory(key);
      setToast("库已删除");
    } catch (e) {
      setToast(e.message);
    }
  };

  const removePlace = async (id) => {
    await deletePlace(id);
    setIndex(1);
    setToast("已经撕掉了");
  };

  const current = pages[index];

  return (
    <div className="book">
      <div className="book__inner">
        {!opened && (
          <Cover onOpen={openCover} opening={opening} count={places.length} />
        )}

        <Pager index={index} onIndexChange={setIndex}>
          {pages.map((p) => {
            if (p.key === "data")
              return (
                <DataPage
                  key={p.key}
                  profile={profile}
                  places={places}
                  entries={entries}
                  onEdit={() => setSheet({ type: "profile" })}
                  onSettings={() => setSheet({ type: "settings" })}
                />
              );
            if (p.key === "contents")
              return (
                <ContentsPage
                  key={p.key}
                  places={places}
                  entries={entries}
                  categories={categories}
                  onJump={jumpToPlace}
                  onAddPlace={() => setSheet({ type: "addPlace" })}
                  onOpenEntry={(e) => setSheet({ type: "entry", entry: e })}
                  onOpenCollection={openCollection}
                  onAddCategory={() => setSheet({ type: "addCategory" })}
                />
              );
            if (p.key === "collections")
              return (
                <CollectionsPage
                  key={p.key}
                  entries={entries}
                  places={places}
                  categories={categories}
                  tab={collectionTab}
                  onTabChange={setCollectionTab}
                  onOpenEntry={(e) => setSheet({ type: "entry", entry: e })}
                  onOpenPerson={(id) => setSheet({ type: "person", personId: id })}
                  onAddCategory={() => setSheet({ type: "addCategory" })}
                  onDeleteCategory={removeCategory}
                />
              );
            if (p.key === "map")
              return <WorldPage key={p.key} places={places} entries={entries} />;
            return (
              <PlacePage
                key={p.key}
                place={p.place}
                entries={entries}
                categories={categories}
                onAdd={(place, catKey) =>
                  setSheet({ type: "addEntry", place, categoryKey: catKey })
                }
                onOpenEntry={(e) => setSheet({ type: "entry", entry: e })}
                onDelete={removePlace}
                onAddCategory={() => setSheet({ type: "addCategory" })}
              />
            );
          })}
        </Pager>

        {opened && (
          <div className="chrome">
            <button
              className="chrome__arrow"
              onClick={() => setIndex(index - 1)}
              disabled={index === 0}
              aria-label="上一页"
            >
              ‹
            </button>
            <span className="chrome__label">
              {current?.label} · {index + 1} / {pages.length}
            </span>
            <button
              className="chrome__arrow"
              onClick={() => setIndex(index + 1)}
              disabled={index === pages.length - 1}
              aria-label="下一页"
            >
              ›
            </button>
          </div>
        )}

        {toast && <div className="toast">{toast}</div>}

        {sheet?.type === "addPlace" && (
          <AddPlaceSheet
            onClose={() => setSheet(null)}
            onCreated={(place) => {
              setSheet(null);
              setToast(`${place.name} 已经盖章`);
              setPendingJump(place.id);
            }}
          />
        )}

        {sheet?.type === "addEntry" && (
          <AddEntrySheet
            place={sheet.place}
            categories={categories}
            categoryKey={sheet.categoryKey}
            onClose={() => setSheet(null)}
            onSaved={() => {
              setSheet(null);
              setToast("记下了");
            }}
          />
        )}

        {sheet?.type === "addCategory" && (
          <AddCategorySheet
            onClose={() => setSheet(null)}
            onCreated={(cat) => {
              setSheet(null);
              setCollectionTab(cat.key);
              setToast(`「${cat.name}」建好了`);
            }}
          />
        )}

        {sheet?.type === "entry" && (
          <EntrySheet
            entry={entries.find((e) => e.id === sheet.entry.id) || sheet.entry}
            place={places.find((p) => p.id === sheet.entry.placeId)}
            category={categories.find((c) => c.key === sheet.entry.categoryKey)}
            onClose={() => setSheet(null)}
            onChanged={() => setToast("已删除")}
            onOpenPerson={(id) => setSheet({ type: "person", personId: id })}
          />
        )}

        {sheet?.type === "person" && (
          <PersonSheet
            personId={sheet.personId}
            places={places}
            onClose={() => setSheet(null)}
            onOpenEntry={(e) => setSheet({ type: "entry", entry: e })}
          />
        )}

        {sheet?.type === "profile" && (
          <ProfileSheet
            profile={profile}
            onClose={() => setSheet(null)}
            onSaved={() => {
              setSheet(null);
              setToast("资料已保存");
            }}
          />
        )}

        {sheet?.type === "settings" && (
          <SettingsSheet
            onClose={() => setSheet(null)}
            onImported={() => {
              setSheet(null);
              setIndex(0);
              setToast("已从备份恢复");
            }}
          />
        )}
      </div>
    </div>
  );
}
