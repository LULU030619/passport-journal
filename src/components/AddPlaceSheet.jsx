import { useState } from "react";
import Sheet from "./Sheet";
import { searchCities } from "../data/cities";
import { addPlace } from "../db";

const today = () => new Date().toISOString().slice(0, 10);

export default function AddPlaceSheet({ onClose, onCreated }) {
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState(null);
  const [date, setDate] = useState(today());
  const [saving, setSaving] = useState(false);

  const hits = picked ? [] : searchCities(q);
  const canSave = picked || q.trim();

  const save = async () => {
    setSaving(true);
    const place = picked
      ? await addPlace({ ...picked, arrivedOn: date })
      : await addPlace({ name: q.trim(), arrivedOn: date });
    setSaving(false);
    onCreated(place);
  };

  return (
    <Sheet
      title="盖一个新的章"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose}>
            取消
          </button>
          <button
            className="btn btn--solid"
            style={{ flex: 1 }}
            disabled={!canSave || saving}
            onClick={save}
          >
            {saving ? <span className="spin" /> : "加进护照"}
          </button>
        </>
      }
    >
      <div className="field">
        <label className="field-label" htmlFor="place-q">
          去了哪里
        </label>
        <input
          id="place-q"
          className="input"
          placeholder="城市名，中英文都行"
          value={picked ? `${picked.name} · ${picked.country}` : q}
          onChange={(e) => {
            setPicked(null);
            setQ(e.target.value);
          }}
          autoFocus
        />
      </div>

      {hits.length > 0 && (
        <div style={{ marginTop: -6, marginBottom: 18 }}>
          {hits.map((c) => (
            <button
              key={c.en}
              className="toc-item"
              onClick={() => {
                setPicked(c);
                setQ("");
              }}
            >
              <span className="toc-item__name">{c.name}</span>
              <span className="toc-item__meta">
                {c.en} · {c.country}
              </span>
            </button>
          ))}
        </div>
      )}

      {!picked && q.trim() && hits.length === 0 && (
        <p className="muted" style={{ marginTop: -6, marginBottom: 18 }}>
          城市库里没有「{q.trim()}」，还是可以直接加进来——只是它不会出现在地图页上。
        </p>
      )}

      <div className="field">
        <label className="field-label" htmlFor="place-date">
          入境日期
        </label>
        <input
          id="place-date"
          className="input"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
    </Sheet>
  );
}
