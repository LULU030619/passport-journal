import { useMemo } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import topo from "world-atlas/countries-110m.json";

const W = 420;
const H = 240;

/**
 * 地图不是主页——它是护照最后一页展开的那张世界图。
 * 真护照的签证页背面本来就印着地图底纹，放这里刚好。
 *
 * 地图数据打包在本地（world-atlas），不请求瓦片服务器，
 * 所以断网也能画出来，样式也能跟证件纸统一。
 */
export default function MapPage({ places, trail, trailName }) {
  const { landPath, projection } = useMemo(() => {
    const land = feature(topo, topo.objects.countries);
    const proj = geoNaturalEarth1().fitSize([W, H], { type: "Sphere" });
    return { landPath: geoPath(proj)(land), projection: proj };
  }, []);

  const pinned = places
    .filter((p) => typeof p.lat === "number" && typeof p.lng === "number")
    .map((p) => {
      const xy = projection([p.lng, p.lat]);
      return xy ? { ...p, x: xy[0], y: xy[1] } : null;
    })
    .filter(Boolean);

  const trailPts = (trail || [])
    .map((t) => {
      const p = t.place;
      if (typeof p?.lat !== "number") return null;
      const xy = projection([p.lng, p.lat]);
      return xy ? { x: xy[0], y: xy[1], name: p.name } : null;
    })
    .filter(Boolean);

  const missing = places.length - pinned.length;

  return (
    <>
      <svg className="worldmap" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="世界地图">
        <path
          d={geoPath(projection)({ type: "Sphere" })}
          fill="var(--paper-warm)"
          stroke="var(--rule)"
          strokeWidth="0.6"
        />
        <path d={landPath} fill="var(--paper-shade)" stroke="var(--rule)" strokeWidth="0.4" />

        {trailPts.length > 1 && (
          <polyline
            points={trailPts.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="var(--stamp-red)"
            strokeWidth="1.1"
            strokeDasharray="3 2.5"
            strokeLinejoin="round"
          />
        )}

        {pinned.map((p) => (
          <g key={p.id}>
            <circle cx={p.x} cy={p.y} r="3.4" fill="var(--stamp-blue)" opacity="0.9" />
            <circle
              cx={p.x}
              cy={p.y}
              r="6.4"
              fill="none"
              stroke="var(--stamp-blue)"
              strokeWidth="0.5"
              opacity="0.45"
            />
          </g>
        ))}

        {trailPts.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3.6"
            fill="var(--stamp-red)"
            stroke="var(--paper)"
            strokeWidth="0.9"
          />
        ))}
      </svg>

      <div className="legend">
        <span>
          <i className="dot" style={{ background: "var(--stamp-blue)" }} /> 去过的地方
        </span>
        {trailPts.length > 0 && (
          <span>
            <i className="dot" style={{ background: "var(--stamp-red)" }} />{" "}
            {trailName || "轨迹"}
          </span>
        )}
      </div>

      {missing > 0 && (
        <p className="muted" style={{ marginTop: 12 }}>
          有 {missing} 个地方没有坐标，暂时画不到图上。在城市库里没收录的地名会这样，
          不影响记录本身。
        </p>
      )}
    </>
  );
}
