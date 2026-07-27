import { useMemo } from "react";

/**
 * 入境章。每个地点页顶上盖一枚。
 *
 * 角度和油墨颜色由地点 id 推导——同一个地方每次打开都长得一样，
 * 但不同地方之间会有细微差别，像真的一枚枚盖上去的。
 */

const INKS = ["var(--stamp-red)", "var(--stamp-blue)", "var(--stamp-green)", "var(--stamp-violet)"];

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export default function Stamp({ id = "x", city, country, date, size = 118 }) {
  const { angle, ink, pathId } = useMemo(() => {
    const h = hash(id);
    return {
      angle: ((h % 17) - 8) * 0.85, // −6.8° ~ +6.8°
      ink: INKS[h % INKS.length],
      pathId: `arc-${id}-${h % 9973}`,
    };
  }, [id]);

  const top = (city || "").toUpperCase().slice(0, 22);
  const bottom = (country || "").toUpperCase().slice(0, 24);
  const parts = (date || "").split("-");
  const dateLine =
    parts.length === 3 ? `${parts[2]} · ${parts[1]} · ${parts[0]}` : date || "";

  return (
    <svg
      className="stamp"
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label={`${city} 入境章`}
      style={{ transform: `rotate(${angle}deg)`, opacity: 0.9 }}
    >
      <defs>
        <path id={`${pathId}-t`} d="M 60,60 m -44,0 a 44,44 0 1,1 88,0" fill="none" />
        <path id={`${pathId}-b`} d="M 60,60 m -38,0 a 38,38 0 1,0 76,0" fill="none" />
      </defs>

      <g stroke={ink} fill="none" strokeWidth="1.6">
        <circle cx="60" cy="60" r="53" strokeWidth="2.2" />
        <circle cx="60" cy="60" r="48.5" strokeWidth="0.8" />
        <circle cx="60" cy="60" r="27" strokeWidth="0.8" strokeDasharray="2 3" />
      </g>

      <g fill={ink} fontFamily="ui-monospace, Menlo, Consolas, monospace">
        <text fontSize="9.4" letterSpacing="2.1" fontWeight="600">
          <textPath href={`#${pathId}-t`} startOffset="50%" textAnchor="middle">
            {top}
          </textPath>
        </text>
        <text fontSize="6.6" letterSpacing="1.5">
          <textPath href={`#${pathId}-b`} startOffset="50%" textAnchor="middle">
            {bottom}
          </textPath>
        </text>

        <text
          x="60"
          y="52"
          textAnchor="middle"
          fontSize="5.4"
          letterSpacing="1.9"
          opacity="0.75"
        >
          ENTRY
        </text>
        <text x="60" y="66" textAnchor="middle" fontSize="9.2" letterSpacing="0.6">
          {dateLine}
        </text>
        <text
          x="60"
          y="76"
          textAnchor="middle"
          fontSize="5"
          letterSpacing="1.5"
          opacity="0.6"
        >
          入 境
        </text>
      </g>

      {/* 左右两颗小星，占位对称，让章不至于太空 */}
      <g fill={ink} opacity="0.7">
        <circle cx="21" cy="60" r="1.7" />
        <circle cx="99" cy="60" r="1.7" />
      </g>
    </svg>
  );
}
