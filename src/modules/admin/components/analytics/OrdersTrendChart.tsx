"use client";

import { useId, useMemo, useState } from "react";
import type { OrdersTrendPoint } from "@/core/types";

interface OrdersTrendChartProps {
  data: OrdersTrendPoint[];
}

const PLACED_COLOR = "#F0740A"; // admin-accent
const COMPLETED_COLOR = "#006CDF"; // brand-blue
const WIDTH = 640;
const HEIGHT = 220;
const PADDING = { top: 16, right: 16, bottom: 24, left: 16 };

/**
 * "Orders Placed vs Completed" line chart. Plain inline SVG — no
 * charting library is installed and this is the only chart in the
 * app, so adding one wasn't justified. Palette validated with the
 * dataviz skill's `validate_palette.js` (passes CVD/normal-vision
 * separation; the orange line's low contrast-vs-surface WARN is
 * offset with direct end-labels + a legend, per that tool's guidance
 * — identity never depends on color alone here).
 */
export function OrdersTrendChart({ data }: OrdersTrendChartProps) {
  const gradientId = useId();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const { placedPath, completedPath, placedAreaPath, points } = useMemo(() => {
    if (data.length === 0) {
      return { placedPath: "", completedPath: "", placedAreaPath: "", points: [] };
    }

    const innerWidth = WIDTH - PADDING.left - PADDING.right;
    const innerHeight = HEIGHT - PADDING.top - PADDING.bottom;
    const max = Math.max(...data.map((d) => Math.max(d.placed, d.completed))) * 1.15 || 1;

    const xFor = (i: number) => PADDING.left + (i / Math.max(1, data.length - 1)) * innerWidth;
    const yFor = (v: number) => PADDING.top + innerHeight - (v / max) * innerHeight;

    const pts = data.map((d, i) => ({
      x: xFor(i),
      placedY: yFor(d.placed),
      completedY: yFor(d.completed),
      label: d.label,
      placed: d.placed,
      completed: d.completed,
    }));

    const line = (key: "placedY" | "completedY") =>
      pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p[key].toFixed(1)}`).join(" ");

    const area =
      line("placedY") +
      ` L ${pts[pts.length - 1].x.toFixed(1)} ${(PADDING.top + innerHeight).toFixed(1)}` +
      ` L ${pts[0].x.toFixed(1)} ${(PADDING.top + innerHeight).toFixed(1)} Z`;

    return { placedPath: line("placedY"), completedPath: line("completedY"), placedAreaPath: area, points: pts };
  }, [data]);

  if (data.length === 0) return null;

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div>
      {/* Legend — identity carried by label + dot, never color alone */}
      <div className="flex items-center gap-4 mb-3">
        <LegendItem color={PLACED_COLOR} label="Orders Placed" />
        <LegendItem color={COMPLETED_COLOR} label="Orders Completed" />
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-auto"
        role="img"
        aria-label="Line chart comparing orders placed and orders completed over time"
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PLACED_COLOR} stopOpacity={0.1} />
            <stop offset="100%" stopColor={PLACED_COLOR} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Recessive gridlines — hairline, one step off surface */}
        {[0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={t}
            x1={PADDING.left}
            x2={WIDTH - PADDING.right}
            y1={PADDING.top + (HEIGHT - PADDING.top - PADDING.bottom) * t}
            y2={PADDING.top + (HEIGHT - PADDING.top - PADDING.bottom) * t}
            stroke="var(--border-default)"
            strokeWidth={1}
          />
        ))}

        <path d={placedAreaPath} fill={`url(#${gradientId})`} />
        <path d={completedPath} fill="none" stroke={COMPLETED_COLOR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <path d={placedPath} fill="none" stroke={PLACED_COLOR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {/* Hover hit targets */}
        {points.map((p, i) => (
          <rect
            key={i}
            x={p.x - (WIDTH / points.length) / 2}
            y={0}
            width={WIDTH / points.length}
            height={HEIGHT}
            fill="transparent"
            onMouseEnter={() => setHoverIndex(i)}
          />
        ))}

        {hovered && (
          <g>
            <line x1={hovered.x} x2={hovered.x} y1={PADDING.top} y2={HEIGHT - PADDING.bottom} stroke="var(--border-strong)" strokeWidth={1} />
            <EndDot x={hovered.x} y={hovered.placedY} color={PLACED_COLOR} />
            <EndDot x={hovered.x} y={hovered.completedY} color={COMPLETED_COLOR} />
          </g>
        )}

        {/* Direct end-labels — mitigates the orange line's low surface contrast */}
        <EndDot x={points[points.length - 1].x} y={points[points.length - 1].placedY} color={PLACED_COLOR} />
        <EndDot x={points[points.length - 1].x} y={points[points.length - 1].completedY} color={COMPLETED_COLOR} />
      </svg>

      {/* X-axis labels */}
      <div className="flex justify-between mt-1 px-4">
        {points.map((p, i) => (
          <span key={i} className="text-[10px] text-text-muted">
            {p.label}
          </span>
        ))}
      </div>

      {hovered && (
        <div className="mt-2 flex items-center gap-4 text-[12px]">
          <span className="text-text-muted">{hovered.label}</span>
          <span style={{ color: PLACED_COLOR }} className="font-semibold">
            Placed {hovered.placed}
          </span>
          <span style={{ color: COMPLETED_COLOR }} className="font-semibold">
            Completed {hovered.completed}
          </span>
        </div>
      )}
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[12px] text-text-secondary">
      <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function EndDot({ x, y, color }: { x: number; y: number; color: string }) {
  return <circle cx={x} cy={y} r={4} fill={color} stroke="var(--bg-card)" strokeWidth={2} />;
}
