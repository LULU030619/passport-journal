import { Children, useRef, useState } from "react";

/**
 * 左右滑动翻页。
 *
 * 刻意没做立体翻书动画：在手机上那种效果很容易做得廉价，
 * 而且每页都有内容要滚动时，3D 变换会拖累滚动手感。
 * 这里用横向位移 + 页边的装订暗影来表达「这是一本册子」。
 */
export default function Pager({ index, onIndexChange, children }) {
  const pages = Children.toArray(children);
  const count = pages.length;
  const [drag, setDrag] = useState(null);
  const start = useRef(null);
  const width = useRef(1);

  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    width.current = e.currentTarget.clientWidth || 1;
    start.current = { x: e.clientX, y: e.clientY, axis: null };
  };

  const onPointerMove = (e) => {
    const s = start.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;

    // 先判断这一下是横划还是竖划，判定完就不再改，避免翻页和滚动打架
    if (!s.axis) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      s.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    }
    if (s.axis !== "x") return;

    // 到头了就加阻尼，滑起来能感觉到边界
    let d = dx;
    if ((index === 0 && dx > 0) || (index === count - 1 && dx < 0)) d = dx * 0.32;
    setDrag(d);
  };

  const onPointerUp = () => {
    const s = start.current;
    start.current = null;
    if (s?.axis !== "x" || drag === null) {
      setDrag(null);
      return;
    }
    const threshold = Math.min(70, width.current * 0.18);
    if (drag < -threshold && index < count - 1) onIndexChange(index + 1);
    else if (drag > threshold && index > 0) onIndexChange(index - 1);
    setDrag(null);
  };

  const pct = -index * 100;
  const px = drag ?? 0;

  return (
    <div
      style={{ position: "absolute", inset: 0 }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div
        className={`pager${drag !== null ? " pager--dragging" : ""}`}
        style={{ transform: `translateX(calc(${pct}% + ${px}px))` }}
      >
        {pages.map((child, i) => (
          <div
            className="pager__slot"
            key={child.key ?? i}
            /* 不是当前页就整页停用：否则 Tab 键会跳进屏幕外的页面 */
            inert={i !== index}
            aria-hidden={i === index ? undefined : "true"}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
