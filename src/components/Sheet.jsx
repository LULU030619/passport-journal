export default function Sheet({ title, onClose, children, footer }) {
  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
      <div className="sheet__bar">
        <span className="sheet__title">{title}</span>
        <button className="btn btn--ghost" onClick={onClose} aria-label="关闭">
          关闭
        </button>
      </div>
      <div className="sheet__scroll">{children}</div>
      {footer && <div className="sheet__foot">{footer}</div>}
    </div>
  );
}
