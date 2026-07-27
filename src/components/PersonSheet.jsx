import { useEffect, useState } from "react";
import Sheet from "./Sheet";
import Photo from "./Photo";
import MapPage from "./MapPage";
import { db, personTrail } from "../db";

export default function PersonSheet({ personId, places, onClose, onOpenEntry }) {
  const [person, setPerson] = useState(null);
  const [trail, setTrail] = useState([]);

  useEffect(() => {
    let alive = true;
    Promise.all([db.persons.get(personId), personTrail(personId)]).then(([p, t]) => {
      if (!alive) return;
      setPerson(p);
      setTrail(t);
    });
    return () => {
      alive = false;
    };
  }, [personId]);

  if (!person) return null;

  const cities = [...new Set(trail.map((t) => t.place.name))];

  return (
    <Sheet title="人物轨迹" onClose={onClose}>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <Photo
          blob={person.avatar}
          className="portrait"
          style={{ width: 66, height: 84, flex: "0 0 66px" }}
          alt={person.name}
          fallback={<div className="portrait portrait--empty" style={{ width: 66, height: 84, flex: "0 0 66px" }}>无照片</div>}
        />
        <div>
          <h2 className="page-title" style={{ fontSize: 25 }}>
            {person.name}
          </h2>
          <p className="eyebrow" style={{ marginTop: 7 }}>
            {cities.length} 个地方 · {trail.length} 次记录
          </p>
        </div>
      </div>

      <hr className="hairline" />

      <MapPage places={places} trail={trail} trailName={person.name} />

      <hr className="hairline" />

      <p className="eyebrow">时间线</p>
      {trail.map(({ entry, place }) => (
        <button key={entry.id} className="trail-item" onClick={() => onOpenEntry(entry)}>
          <Photo
            blob={entry.photo}
            className="trail-item__thumb"
            alt=""
            fallback={<div className="trail-item__thumb" />}
          />
          <span style={{ flex: 1 }}>
            <span style={{ fontFamily: "var(--f-serif)", fontSize: 16, display: "block" }}>
              {place.name}
            </span>
            <span className="muted" style={{ fontSize: 12 }}>
              {entry.note || "—"}
            </span>
          </span>
          <span className="toc-item__meta">{entry.date || place.arrivedOn}</span>
        </button>
      ))}
    </Sheet>
  );
}
