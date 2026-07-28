import { useRef, useState } from "react";
import Photo from "./Photo";

/**
 * 记录网格，支持长按拖动重排。
 *
 * 手机上用长按触发（250ms），避免和翻页、滚动打架；
 * 桌面上用鼠标按住直接拖。排序结果通过 onReorder 交回上层写库。
 *
 * subtitle(entry) 决定卡片副标题——地点页显示备注，库页显示所在城市。
 */
export default function EntryGrid({ entries, onOpen, onReorder, subtitle }) {
  const [order, setOrder] = useState(null); // 拖动过程中的临时顺序
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);
  const holdTimer = useRef(null);
  const startPt = useRef(null);

  const list = order || entries;

  const beginDrag = (id) => {
    setDragId(id);
    setOrder(entries.map((e) => e.id));
  };

  const onPointerDown = (e, id) => {
    startPt.current = { x: e.clientX, y: e.clientY };
    // 长按才进入拖动，短按仍然是「打开」
    holdTimer.current = setTimeout(() => beginDrag(id), 250);
  };

  const onPointerMove = (e, id) => {
    // 手指移动超过阈值又还没触发长按 → 判定为滚动，取消拖动意图
    if (holdTimer.current && startPt.current) {
      const dx = Math.abs(e.clientX - startPt.current.x);
      const dy = Math.abs(e.clientY - startPt.current.y);
      if (dx > 10 || dy > 10) {
        clearTimeout(holdTimer.current);
        holdTimer.current = null;
      }
    }
    if (!dragId) return;
    e.preventDefault();
    if (id && id !== overId) setOverId(id);
  };

  const reorderTo = (targetId) => {
    if (!dragId || dragId === targetId) return;
    const ids = [...(order || entries.map((x) => x.id))];
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    setOrder(ids);
  };

  const endDrag = () => {
    clearTimeout(holdTimer.current);
    holdTimer.current = null;
    if (dragId && order) {
      const changed = order.some((id, i) => entries[i]?.id !== id);
      if (changed) onReorder(order);
    }
    setDragId(null);
    setOverId(null);
    setOrder(null);
    startPt.current = null;
  };

  const byId = new Map(entries.map((e) => [e.id, e]));

  return (
    <>
      {onReorder && entries.length > 1 && (
        <p className="reorder-hint">长按可拖动排序</p>
      )}
      <div className="grid">
        {list.map((item) => {
          const e = byId.get(item.id) || item;
          return (
            <button
              key={e.id}
              className={
                "card" +
                (dragId === e.id ? " card--dragging" : "") +
                (overId === e.id && dragId && dragId !== e.id ? " card--over" : "")
              }
              onPointerDown={(ev) => onPointerDown(ev, e.id)}
              onPointerMove={(ev) => onPointerMove(ev, e.id)}
              onPointerEnter={() => dragId && reorderTo(e.id)}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onClick={() => !dragId && onOpen(e)}
            >
              <Photo
                blob={e.photo}
                className="card__img"
                alt={e.name}
                fallback={<div className="card__img" />}
              />
              {onReorder && <span className="card__handle">⠿</span>}
              <p className="card__name">{e.name || "—"}</p>
              <p className="card__note">{subtitle ? subtitle(e) : e.note}</p>
            </button>
          );
        })}
      </div>
    </>
  );
}
