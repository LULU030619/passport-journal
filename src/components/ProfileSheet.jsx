import { useRef, useState } from "react";
import Sheet from "./Sheet";
import Photo from "./Photo";
import PhotoCropper from "./PhotoCropper";
import { saveProfile } from "../db";

export default function ProfileSheet({ profile, onClose, onSaved }) {
  const [form, setForm] = useState(profile);
  const [cropFile, setCropFile] = useState(null);
  const fileRef = useRef(null);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async () => {
    await saveProfile(form);
    onSaved();
  };

  if (cropFile) {
    return (
      <Sheet title="调整证件照" onClose={() => setCropFile(null)}>
        <PhotoCropper
          file={cropFile}
          onCancel={() => setCropFile(null)}
          onDone={(blob) => {
            setForm({ ...form, portrait: blob });
            setCropFile(null);
          }}
        />
      </Sheet>
    );
  }

  return (
    <Sheet
      title="资料页"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose}>
            取消
          </button>
          <button className="btn btn--solid" style={{ flex: 1 }} onClick={save}>
            保存
          </button>
        </>
      }
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="file-input"
        onChange={(e) => e.target.files?.[0] && setCropFile(e.target.files[0])}
      />

      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <Photo
          blob={form.portrait}
          className="portrait"
          alt=""
          fallback={<div className="portrait portrait--empty">还没有照片</div>}
        />
        <div>
          <button className="btn btn--ghost" onClick={() => fileRef.current?.click()}>
            换一张
          </button>
          <p className="muted" style={{ marginTop: 10 }}>
            会裁成方形，显示时按证件照的比例取中间。
          </p>
        </div>
      </div>

      <hr className="hairline" />

      <div className="field">
        <label className="field-label" htmlFor="p-name">
          姓名 / Name
        </label>
        <input id="p-name" className="input" value={form.name || ""} onChange={set("name")} />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="p-en">
          拼音 / Romanized
        </label>
        <input id="p-en" className="input" value={form.nameEn || ""} onChange={set("nameEn")} />
      </div>
      <div className="row">
        <div className="field">
          <label className="field-label" htmlFor="p-nat">
            国籍
          </label>
          <input
            id="p-nat"
            className="input"
            value={form.nationality || ""}
            onChange={set("nationality")}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="p-birth">
            出生地
          </label>
          <input
            id="p-birth"
            className="input"
            value={form.birthPlace || ""}
            onChange={set("birthPlace")}
          />
        </div>
      </div>
      <div className="field">
        <label className="field-label" htmlFor="p-since">
          这本册子从哪天开始
        </label>
        <input
          id="p-since"
          className="input"
          type="date"
          value={form.since || ""}
          onChange={set("since")}
        />
      </div>
    </Sheet>
  );
}
