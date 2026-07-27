import { useEffect, useRef, useState } from "react";
import Sheet from "./Sheet";
import PhotoCropper from "./PhotoCropper";
import Photo from "./Photo";
import { PRESETS, stylize } from "../lib/ai";
import { addEntry, createPerson, findPersonsByName } from "../db";

export default function AddEntrySheet({ place, categories, categoryKey, onClose, onSaved }) {
  const [step, setStep] = useState("pick"); // pick → crop → form
  const [file, setFile] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [original, setOriginal] = useState(null);
  const [cat, setCat] = useState(categoryKey || categories[0]?.key);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(place.arrivedOn || "");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiHidden, setAiHidden] = useState(false);
  const [msg, setMsg] = useState("");
  const [matches, setMatches] = useState([]);
  const [linkTo, setLinkTo] = useState(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  // 人物同名检查。只提示，不自动合并——认错人比漏认更难解释。
  useEffect(() => {
    if (cat !== "person" || !name.trim()) {
      setMatches([]);
      setLinkTo(null);
      return;
    }
    let alive = true;
    findPersonsByName(name).then((r) => alive && setMatches(r));
    return () => {
      alive = false;
    };
  }, [cat, name]);

  const runAI = async (prompt) => {
    if (!photo) return;
    setAiBusy(true);
    setMsg("");
    try {
      if (!original) setOriginal(photo);
      const out = await stylize(original || photo, prompt);
      setPhoto(out);
    } catch (e) {
      setMsg(e.message);
      if (/未配置/.test(e.message)) setAiHidden(true);
    } finally {
      setAiBusy(false);
    }
  };

  const save = async () => {
    setSaving(true);
    let personId = null;
    if (cat === "person" && name.trim()) {
      personId = linkTo ?? (await createPerson({ name, avatar: photo })).id;
    }
    await addEntry({
      placeId: place.id,
      categoryKey: cat,
      name,
      photo,
      note,
      date,
      personId,
    });
    setSaving(false);
    onSaved();
  };

  /* ---------- 选图 ---------- */
  if (step === "pick") {
    return (
      <Sheet title={`${place.name} · 添加一条`} onClose={onClose}>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="file-input"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              setFile(f);
              setStep("crop");
            }
          }}
        />
        <button
          className="empty"
          style={{ width: "100%", cursor: "pointer" }}
          onClick={() => inputRef.current?.click()}
        >
          拍照或从相册选一张
          <br />
          <span style={{ fontSize: 11 }}>照片只存在这台设备上，不会上传</span>
        </button>

        <div style={{ marginTop: 18 }}>
          <button className="btn btn--ghost btn--block" onClick={() => setStep("form")}>
            不放照片，直接写
          </button>
        </div>
      </Sheet>
    );
  }

  /* ---------- 裁剪 ---------- */
  if (step === "crop") {
    return (
      <Sheet title="调整取景" onClose={onClose}>
        <PhotoCropper
          file={file}
          onCancel={() => setStep("pick")}
          onDone={(blob) => {
            setPhoto(blob);
            setOriginal(blob);
            setStep("form");
          }}
        />
      </Sheet>
    );
  }

  /* ---------- 填写 ---------- */
  return (
    <Sheet
      title="这是什么"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose}>
            取消
          </button>
          <button
            className="btn btn--solid"
            style={{ flex: 1 }}
            disabled={saving}
            onClick={save}
          >
            {saving ? <span className="spin" /> : "记下来"}
          </button>
        </>
      }
    >
      {photo && (
        <>
          <Photo blob={photo} className="detail__img" alt="" />
          {!aiHidden && (
            <>
              <p className="field-label" style={{ marginTop: 16 }}>
                换个样子（可跳过）
              </p>
              <div className="chips">
                {PRESETS.map((p) => (
                  <button
                    key={p.key}
                    className="chip"
                    disabled={aiBusy}
                    onClick={() => runAI(p.prompt)}
                  >
                    {p.label}
                  </button>
                ))}
                {original && photo !== original && (
                  <button className="chip" onClick={() => setPhoto(original)}>
                    还原
                  </button>
                )}
              </div>
              {aiBusy && (
                <p className="muted" style={{ marginTop: 8 }}>
                  正在生成，大约十几秒…
                </p>
              )}
            </>
          )}
          {msg && (
            <p className="muted" style={{ marginTop: 8, color: "var(--stamp-red)" }}>
              {msg}
            </p>
          )}
          <hr className="hairline" />
        </>
      )}

      <div className="field">
        <label className="field-label">归到哪一类</label>
        <div className="chips">
          {categories.map((c) => (
            <button
              key={c.key}
              className={`chip${cat === c.key ? " chip--on" : ""}`}
              onClick={() => setCat(c.key)}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="e-name">
          名称
        </label>
        <input
          id="e-name"
          className="input"
          placeholder={cat === "person" ? "他叫什么" : "这是什么"}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {matches.length > 0 && (
        <div className="field">
          <p className="muted" style={{ marginBottom: 8 }}>
            之前也记过一个叫「{name.trim()}」的人。是同一个吗？
          </p>
          <div className="chips">
            {matches.map((m) => (
              <button
                key={m.id}
                className={`chip${linkTo === m.id ? " chip--on" : ""}`}
                onClick={() => setLinkTo(linkTo === m.id ? null : m.id)}
              >
                是同一个人
              </button>
            ))}
            <button
              className={`chip${linkTo === null ? " chip--on" : ""}`}
              onClick={() => setLinkTo(null)}
            >
              另一个人
            </button>
          </div>
        </div>
      )}

      <div className="field">
        <label className="field-label" htmlFor="e-note">
          备注
        </label>
        <textarea
          id="e-note"
          className="textarea"
          placeholder="在哪儿、怎么遇上的、当时在想什么"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="e-date">
          日期
        </label>
        <input
          id="e-date"
          className="input"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
    </Sheet>
  );
}
