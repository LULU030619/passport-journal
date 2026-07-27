import { useState } from "react";
import Sheet from "./Sheet";
import Photo from "./Photo";
import { deleteEntry } from "../db";

export default function EntrySheet({ entry, place, category, onClose, onChanged, onOpenPerson }) {
  const [confirming, setConfirming] = useState(false);

  const remove = async () => {
    await deleteEntry(entry.id);
    onChanged();
    onClose();
  };

  return (
    <Sheet title={category?.name || "记录"} onClose={onClose}>
      {entry.photo && <Photo blob={entry.photo} className="detail__img" alt={entry.name} />}

      <h2 className="page-title" style={{ fontSize: 24, marginTop: 16 }}>
        {entry.name || "（没写名字）"}
      </h2>
      <p className="eyebrow" style={{ marginTop: 8 }}>
        {place?.name} · {entry.date || place?.arrivedOn || ""}
      </p>

      {entry.note && (
        <>
          <hr className="hairline" />
          <p style={{ fontFamily: "var(--f-serif)", fontSize: 15.5, lineHeight: 1.85, whiteSpace: "pre-wrap", margin: 0 }}>
            {entry.note}
          </p>
        </>
      )}

      {entry.personId && (
        <div style={{ marginTop: 22 }}>
          <button className="btn btn--block" onClick={() => onOpenPerson(entry.personId)}>
            看他的轨迹
          </button>
        </div>
      )}

      <hr className="hairline" style={{ marginTop: 28 }} />

      {confirming ? (
        <div className="row">
          <button className="btn btn--ghost" onClick={() => setConfirming(false)}>
            算了
          </button>
          <button
            className="btn"
            style={{ borderColor: "var(--stamp-red)", color: "var(--stamp-red)" }}
            onClick={remove}
          >
            确认删除
          </button>
        </div>
      ) : (
        <button className="btn btn--ghost btn--block" onClick={() => setConfirming(true)}>
          删掉这条
        </button>
      )}
    </Sheet>
  );
}
