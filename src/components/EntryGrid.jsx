import { useState } from "react";
import Photo from "./Photo";

/**
 * 记录网格。
 *
 * 排序不用拖拽——长按拖动在手机上和滚动、翻页冲突，还容易误触。
 * 改成「整理」模式：点右上角进入后，每张卡片出现 ‹ › 两个箭头，
 * 点一下把它往前 / 往后挪一格。稳、可预期、不依赖手势。
 */
export default function EntryGrid({ entries, onOpen, onReorder, subtitle }) {
  const [arranging, setArranging] = useState(false);

  const move = (id, dir) => {
    const ids = entries.map((e) => e.id);
    const i = ids.indexOf(id);
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    onReorder(ids);
  };

  return (
    <>
      {onReorder && entries.length > 1 && (
        <div className="grid-toolbar">
          <button
            className={"arrange-btn" + (arranging ? " arrange-btn--on" : "")}
            onClick={() => setArranging((v) => !v)}
          >
            {arranging ? "完成" : "调整顺序"}
          </button>
        </div>
      )}

      <div className="grid">
        {entries.map((e, i) => (
          <div key={e.id} className="card">
            <button
              className="card__hit"
              onClick={() => !arranging && onOpen(e)}
              aria-label={e.name || "记录"}
            >
              <div className="card__imgwrap">
                <Photo
                  blob={e.photo}
                  className="card__img"
                  alt={e.name}
                  fallback={<div className="card__img" />}
                />
              </div>
              <p className="card__name">{e.name || "—"}</p>
              <p className="card__note">{subtitle ? subtitle(e) : e.note}</p>
            </button>

            {arranging && (
              <div className="card__reorder">
                <button
                  className="reorder-arrow"
                  disabled={i === 0}
                  onClick={() => move(e.id, -1)}
                  aria-label="往前挪"
                >
                  ‹
                </button>
                <button
                  className="reorder-arrow"
                  disabled={i === entries.length - 1}
                  onClick={() => move(e.id, 1)}
                  aria-label="往后挪"
                >
                  ›
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
