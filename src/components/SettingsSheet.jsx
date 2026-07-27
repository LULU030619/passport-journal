import { useRef, useState } from "react";
import Sheet from "./Sheet";
import { downloadBackup, importBackup } from "../lib/backup";

export default function SettingsSheet({ onClose, onImported }) {
  const fileRef = useRef(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const doImport = async (file) => {
    setBusy(true);
    setMsg("");
    try {
      await importBackup(file);
      onImported();
      setMsg("导入完成。");
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet title="备份" onClose={onClose}>
      <p className="muted">
        所有内容都存在这台设备的浏览器里，没有账号，也不会上传到任何服务器。
        好处是隐私；代价是清掉浏览器数据就全没了。所以换设备或者清缓存之前，
        先导出一份。
      </p>

      <div style={{ marginTop: 20, display: "grid", gap: 10 }}>
        <button className="btn btn--solid btn--block" onClick={downloadBackup} disabled={busy}>
          导出备份文件
        </button>
        <button
          className="btn btn--ghost btn--block"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
        >
          {busy ? <span className="spin" /> : "从备份文件恢复"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="file-input"
          onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])}
        />
      </div>

      <p className="muted" style={{ marginTop: 10 }}>
        恢复会覆盖当前所有内容。
      </p>

      {msg && (
        <p className="muted" style={{ marginTop: 14, color: "var(--stamp-red)" }}>
          {msg}
        </p>
      )}

      <hr className="hairline" style={{ marginTop: 30 }} />

      <p className="eyebrow">装到手机上</p>
      <p className="muted">
        iPhone：Safari 打开这个网址 → 分享 → 添加到主屏幕。
        <br />
        安卓：Chrome 菜单 → 添加到主屏幕。
        <br />
        之后它会像一个普通 App 一样有图标、全屏打开。
      </p>
    </Sheet>
  );
}
