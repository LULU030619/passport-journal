import { useState } from "react";
import Sheet from "./Sheet";
import { addCategory } from "../db";

const ICONS = ["◇", "✦", "☾", "❋", "⌂", "♪", "✈", "☂", "⚑", "✿", "◒", "☺"];

export default function AddCategorySheet({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(ICONS[0]);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const cat = await addCategory({ name, icon });
    setSaving(false);
    onCreated(cat);
  };

  return (
    <Sheet
      title="新建一个库"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose}>
            取消
          </button>
          <button
            className="btn btn--solid"
            style={{ flex: 1 }}
            disabled={!name.trim() || saving}
            onClick={save}
          >
            {saving ? <span className="spin" /> : "建好了"}
          </button>
        </>
      }
    >
      <p className="muted">
        建一次，所有地点页里都会出现这一类。比如「车票」「书」「声音」「住过的房间」。
      </p>

      <div className="field" style={{ marginTop: 20 }}>
        <label className="field-label" htmlFor="cat-name">
          叫什么
        </label>
        <input
          id="cat-name"
          className="input"
          placeholder="车票"
          maxLength={8}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>

      <div className="field">
        <label className="field-label">挑个符号</label>
        <div className="chips">
          {ICONS.map((i) => (
            <button
              key={i}
              className={`chip${icon === i ? " chip--on" : ""}`}
              style={{ minWidth: 42, justifyContent: "center", fontSize: 15 }}
              onClick={() => setIcon(i)}
            >
              {i}
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  );
}
