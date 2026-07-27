import { useEffect, useRef, useState } from "react";
import { cropToSquare, fileToImage } from "../lib/image";

/**
 * 方形裁剪：拖动取景，滑杆缩放。
 * 没做自由比例——证件页上所有照片统一方形，版面才立得住。
 */
export default function PhotoCropper({ file, onDone, onCancel }) {
  const boxRef = useRef(null);
  const [img, setImg] = useState(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [boxW, setBoxW] = useState(300);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const drag = useRef(null);

  useEffect(() => {
    let revoke;
    fileToImage(file)
      .then((r) => {
        revoke = r.revoke;
        setImg(r.img);
      })
      .catch((e) => setError(e.message));
    return () => revoke?.();
  }, [file]);

  useEffect(() => {
    const measure = () => boxRef.current && setBoxW(boxRef.current.clientWidth);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [img]);

  if (error) {
    return (
      <div className="empty">
        {error}
        <div style={{ marginTop: 14 }}>
          <button className="btn btn--ghost" onClick={onCancel}>
            返回
          </button>
        </div>
      </div>
    );
  }

  if (!img) return <div className="empty">正在打开照片…</div>;

  const short = Math.min(img.naturalWidth, img.naturalHeight);
  const ratio = (boxW * scale) / short; // 自然像素 → 屏幕像素
  const dispW = img.naturalWidth * ratio;
  const dispH = img.naturalHeight * ratio;

  const clamp = (o, r = ratio) => {
    const maxX = Math.max(0, (img.naturalWidth * r - boxW) / 2 / r);
    const maxY = Math.max(0, (img.naturalHeight * r - boxW) / 2 / r);
    return {
      x: Math.min(maxX, Math.max(-maxX, o.x)),
      y: Math.min(maxY, Math.max(-maxY, o.y)),
    };
  };

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, ...offset };
  };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    const dx = (e.clientX - drag.current.px) / ratio;
    const dy = (e.clientY - drag.current.py) / ratio;
    setOffset(clamp({ x: drag.current.x + dx, y: drag.current.y + dy }));
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  const onScale = (v) => {
    setScale(v);
    setOffset((o) => clamp(o, (boxW * v) / short));
  };

  const confirm = async () => {
    setBusy(true);
    try {
      const blob = await cropToSquare(img, {
        scale,
        offsetX: offset.x,
        offsetY: offset.y,
      });
      onDone(blob);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div
        className="cropper"
        ref={boxRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <img
          src={img.src}
          alt=""
          draggable={false}
          style={{
            position: "absolute",
            width: dispW,
            height: dispH,
            left: (boxW - dispW) / 2 + offset.x * ratio,
            top: (boxW - dispH) / 2 + offset.y * ratio,
            userSelect: "none",
            pointerEvents: "none",
          }}
        />
        <div className="cropper__frame" />
      </div>

      <label className="field-label" style={{ marginTop: 16 }}>
        缩放
      </label>
      <input
        className="slider"
        type="range"
        min="1"
        max="3"
        step="0.01"
        value={scale}
        onChange={(e) => onScale(Number(e.target.value))}
      />
      <p className="muted" style={{ marginTop: 2 }}>
        拖动照片调整取景。
      </p>

      <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
        <button className="btn btn--ghost" onClick={onCancel} disabled={busy}>
          取消
        </button>
        <button className="btn btn--solid" style={{ flex: 1 }} onClick={confirm} disabled={busy}>
          {busy ? <span className="spin" /> : "用这张"}
        </button>
      </div>
    </div>
  );
}
