import { useEffect, useState } from "react";

/** Blob → <img>。组件卸载时释放地址，不然翻久了内存会一直涨。 */
export default function Photo({ blob, alt = "", className, style, fallback = null }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);

  if (!url) return fallback;
  return <img src={url} alt={alt} className={className} style={style} />;
}
