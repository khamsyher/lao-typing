"use client";

import { useEffect, useRef, useState } from "react";

export interface TrendPoint {
  day: string; // YYYY-MM-DD
  wpm: number;
  tests: number;
}

interface Props {
  points: TrendPoint[];
  lang: "lo" | "en";
  labels: { wpm: string; tests: string; summary: string };
}

const HEIGHT = 220;
const PAD = { top: 16, right: 16, bottom: 28, left: 40 };

// Round tick step (1, 2, 5 × 10^n) giving about `count` gridlines.
function niceTicks(max: number, count = 4): number[] {
  const raw = Math.max(max, 1) / count;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw;
  const top = Math.ceil(max / step) * step || step;
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
}

// Single-series line chart (average WPM per day). One series, so the title names it and
// there is no legend; the results table on the page is the table view.
export default function SpeedTrendChart({ points, lang, labels }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fmtDay = (day: string, long = false) =>
    new Intl.DateTimeFormat(lang === "lo" ? "lo-LA" : "en-GB", {
      day: "numeric",
      month: "short",
      ...(long ? { weekday: "short" } : {}),
      timeZone: "UTC",
    }).format(new Date(`${day}T00:00:00Z`));

  const ticks = niceTicks(Math.max(...points.map((p) => p.wpm)));
  const yMax = ticks[ticks.length - 1];
  const plotW = width - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const y = (v: number) => PAD.top + plotH - (v / yMax) * plotH;
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.wpm).toFixed(1)}`).join(" ");

  // Show the first, middle and last day on the x axis.
  const xLabels = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])];

  const nearest = (clientX: number) => {
    const box = wrapRef.current!.getBoundingClientRect();
    const px = clientX - box.left;
    let best = 0;
    points.forEach((_, i) => {
      if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i;
    });
    return best;
  };

  const point = active !== null ? points[active] : null;
  const tipLeft = active !== null ? Math.min(Math.max(x(active), 70), width - 70) : 0;

  return (
    <div ref={wrapRef} className="relative w-full select-none">
      <svg
        width={width}
        height={HEIGHT}
        role="img"
        aria-label={labels.summary}
        tabIndex={0}
        className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent"
        onPointerMove={(e) => setActive(nearest(e.clientX))}
        onPointerLeave={() => setActive(null)}
        onFocus={() => setActive(points.length - 1)}
        onBlur={() => setActive(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setActive((a) => Math.max(0, (a ?? points.length - 1) - 1));
          if (e.key === "ArrowRight") setActive((a) => Math.min(points.length - 1, (a ?? 0) + 1));
        }}
      >
        {/* recessive grid + y labels */}
        {ticks.map((tk) => (
          <g key={tk}>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(tk)} y2={y(tk)} className="stroke-chart-grid" strokeWidth={1} />
            <text x={PAD.left - 8} y={y(tk)} dy="0.32em" textAnchor="end" className="fill-muted font-mono text-[11px]">
              {tk}
            </text>
          </g>
        ))}
        {xLabels.map((i) => (
          <text
            key={i}
            x={x(i)}
            y={HEIGHT - 8}
            textAnchor={points.length === 1 ? "middle" : i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}
            className="fill-muted font-lao text-[11px]"
          >
            {fmtDay(points[i].day)}
          </text>
        ))}

        {/* crosshair */}
        {active !== null && (
          <line
            x1={x(active)}
            x2={x(active)}
            y1={PAD.top}
            y2={PAD.top + plotH}
            className="stroke-muted"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        )}

        <path d={path} fill="none" className="stroke-chart-line" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle
            key={p.day}
            cx={x(i)}
            cy={y(p.wpm)}
            r={active === i ? 5.5 : 4}
            className="fill-chart-line stroke-surface"
            strokeWidth={2}
          />
        ))}
      </svg>

      {point && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-md"
          style={{ left: tipLeft }}
        >
          <div className="font-lao text-muted">{fmtDay(point.day, true)}</div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-chart-line" aria-hidden />
            <span className="font-mono font-semibold tabular-nums text-fg">{Math.round(point.wpm)}</span>
            <span className="font-lao text-muted">{labels.wpm}</span>
          </div>
          <div className="font-lao text-muted">
            {point.tests} {labels.tests}
          </div>
        </div>
      )}
    </div>
  );
}
