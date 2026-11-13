"use client";

import { useMemo, useState } from "react";
import { BarChart2, LineChart, TrendingUp } from "lucide-react";
import type { Transaction } from "@/lib/types";
import { formatRupiah } from "@/lib/format";

interface SalesChartProps {
  transactions: Transaction[];
  days?: number;
  today?: Date;
}

type ChartMode = "line" | "bar";

function formatShortRupiah(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1).replace(/\.0$/, "")}jt`;
  }
  if (amount >= 1_000) {
    return `Rp ${Math.round(amount / 1_000)}rb`;
  }
  return `Rp ${amount}`;
}

function createSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export default function SalesChart({
  transactions,
  days: defaultDays = 7,
  today,
}: SalesChartProps) {
  const [days, setDays] = useState<number>(defaultDays);
  const [chartMode, setChartMode] = useState<ChartMode>("line");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const data = useMemo(() => {
    const result: {
      label: string;
      shortDate: string;
      fullDate: string;
      total: number;
      count: number;
      date: Date;
    }[] = [];

    const now = today ?? new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);

      const matching = transactions.filter((t) => {
        const td = new Date(t.date);
        return (
          td.getFullYear() === d.getFullYear() &&
          td.getMonth() === d.getMonth() &&
          td.getDate() === d.getDate()
        );
      });

      const total = matching.reduce((sum, t) => sum + t.total, 0);

      result.push({
        label: d.toLocaleDateString("id-ID", { weekday: "short" }),
        shortDate: d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
        fullDate: d.toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        total,
        count: matching.length,
        date: d,
      });
    }
    return result;
  }, [transactions, days, today]);

  const rawMax = Math.max(...data.map((d) => d.total), 0);
  const yMax = rawMax > 0 ? Math.ceil(rawMax * 1.18) : 100_000;
  const totalPeriod = data.reduce((sum, d) => sum + d.total, 0);
  const totalTxPeriod = data.reduce((sum, d) => sum + d.count, 0);
  const avgDaily = Math.round(totalPeriod / data.length);
  const peakDay = useMemo(() => {
    return [...data].sort((a, b) => b.total - a.total)[0];
  }, [data]);

  // SVG Geometry
  const svgWidth = 640;
  const svgHeight = 230;
  const padLeft = 70;
  const padRight = 24;
  const padTop = 22;
  const padBottom = 42;
  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;
  const baselineY = padTop + chartH;

  const points = useMemo(() => {
    if (data.length <= 1) {
      return [{ x: padLeft + chartW / 2, y: baselineY }];
    }
    const stepX = chartW / (data.length - 1);
    return data.map((d, i) => {
      const x = padLeft + i * stepX;
      const ratio = yMax > 0 ? d.total / yMax : 0;
      const y = baselineY - ratio * chartH;
      return { x, y };
    });
  }, [data, chartW, chartH, baselineY, padLeft, yMax]);

  const linePath = useMemo(() => createSmoothPath(points), [points]);
  const areaPath = useMemo(() => {
    if (points.length === 0) return "";
    const first = points[0];
    const last = points[points.length - 1];
    return `${linePath} L ${last.x.toFixed(1)} ${baselineY} L ${first.x.toFixed(1)} ${baselineY} Z`;
  }, [linePath, points, baselineY]);

  // Y-axis grid thresholds (0%, 33%, 66%, 100%)
  const ySteps = [0, 0.33, 0.66, 1];

  const activeItem = hoveredIdx !== null ? data[hoveredIdx] : null;
  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">
      {/* Header with Title, Mode & Range Toggles */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-stone-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-latte)] text-[var(--color-terracotta)]">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-stone-800">
                Grafik Garis Penjualan
              </h3>
              <p className="text-xs text-stone-500">Tren pendapatan harian</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switch: Garis vs Batang */}
          <div className="flex rounded-xl border border-stone-200 bg-stone-50 p-0.5">
            <button
              onClick={() => setChartMode("line")}
              title="Grafik Garis"
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                chartMode === "line"
                  ? "bg-white text-[var(--color-terracotta)] shadow-sm"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <LineChart className="h-3.5 w-3.5" />
              Garis
            </button>
            <button
              onClick={() => setChartMode("bar")}
              title="Grafik Batang"
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                chartMode === "bar"
                  ? "bg-white text-[var(--color-terracotta)] shadow-sm"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <BarChart2 className="h-3.5 w-3.5" />
              Batang
            </button>
          </div>

          {/* Range Switch: 7H, 14H, 30H */}
          <div className="flex rounded-xl border border-stone-200 bg-stone-50 p-0.5">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => {
                  setDays(d);
                  setHoveredIdx(null);
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  days === d
                    ? "bg-[var(--color-choco)] text-[var(--color-cream)] shadow-sm"
                    : "text-stone-500 hover:text-stone-800"
                }`}
              >
                {d}H
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metric Highlights Banner */}
      <div className="mt-3.5 mb-2 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-stone-50/80 px-4 py-2.5 text-xs">
        {activeItem && activePoint ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-extrabold text-[var(--color-terracotta)]">
              {activeItem.fullDate}:
            </span>
            <span className="font-black text-stone-800 text-sm">
              {formatRupiah(activeItem.total)}
            </span>
            <span className="rounded-md bg-stone-200/80 px-2 py-0.5 text-[10px] font-bold text-stone-600">
              {activeItem.count} transaksi
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3 sm:gap-6">
            <div>
              <span className="text-stone-400 font-medium">Total {days} Hari: </span>
              <span className="font-extrabold text-stone-800">
                {formatRupiah(totalPeriod)}
              </span>
            </div>
            <div>
              <span className="text-stone-400 font-medium">Rata-rata: </span>
              <span className="font-semibold text-stone-700">
                {formatRupiah(avgDaily)}/hari
              </span>
            </div>
            {peakDay && peakDay.total > 0 && (
              <div>
                <span className="text-stone-400 font-medium">Puncak: </span>
                <span className="font-semibold text-emerald-700">
                  {peakDay.shortDate} ({formatRupiah(peakDay.total)})
                </span>
              </div>
            )}
          </div>
        )}

        <div className="text-[11px] font-semibold text-stone-400">
          {totalTxPeriod} total nota
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative mt-2 w-full select-none overflow-hidden rounded-xl bg-gradient-to-b from-stone-50/40 to-white pt-2">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="h-auto w-full overflow-visible"
        >
          <defs>
            {/* Line Stroke Gradient */}
            <linearGradient id="salesLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#bd6a55" />
              <stop offset="50%" stopColor="#d9a359" />
              <stop offset="100%" stopColor="#bd6a55" />
            </linearGradient>

            {/* Area Fill Gradient */}
            <linearGradient id="salesAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#bd6a55" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#d9a359" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#d9a359" stopOpacity="0.0" />
            </linearGradient>

            {/* Bar Fill Gradient */}
            <linearGradient id="salesBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#bd6a55" />
              <stop offset="100%" stopColor="#e7bf7b" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid Lines & Y-Axis Labels */}
          {ySteps.map((ratio, i) => {
            const val = yMax * ratio;
            const y = baselineY - ratio * chartH;
            return (
              <g key={i}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={svgWidth - padRight}
                  y2={y}
                  stroke="#e7e5e4"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 10}
                  y={y + 3.5}
                  textAnchor="end"
                  fill="#a8a29e"
                  fontSize="10"
                  fontWeight="600"
                  fontFamily="monospace"
                >
                  {formatShortRupiah(val)}
                </text>
              </g>
            );
          })}

          {/* Mode: Bar Chart */}
          {chartMode === "bar" &&
            data.map((d, i) => {
              const pt = points[i];
              const barWidth = Math.max(Math.min(chartW / data.length - 8, 32), 6);
              const barH = baselineY - pt.y;
              const isHovered = hoveredIdx === i;
              return (
                <rect
                  key={i}
                  x={pt.x - barWidth / 2}
                  y={pt.y}
                  width={barWidth}
                  height={Math.max(barH, 3)}
                  rx="4"
                  fill={isHovered ? "url(#salesLineGrad)" : "url(#salesBarGrad)"}
                  opacity={hoveredIdx !== null && !isHovered ? 0.45 : 0.9}
                  className="transition-all duration-200"
                />
              );
            })}

          {/* Mode: Line Chart (Area Fill + Continuous Spline Curve) */}
          {chartMode === "line" && (
            <>
              {/* Soft area under curve */}
              <path
                d={areaPath}
                fill="url(#salesAreaGrad)"
                className="transition-all duration-300"
              />

              {/* Bold trend line */}
              <path
                d={linePath}
                fill="none"
                stroke="url(#salesLineGrad)"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-300"
              />
            </>
          )}

          {/* Data Points on Line */}
          {points.map((pt, i) => {
            const isHovered = hoveredIdx === i;
            const isToday = i === data.length - 1;
            return (
              <g key={i} className="transition-all duration-150">
                {/* Active vertical guideline */}
                {isHovered && (
                  <line
                    x1={pt.x}
                    y1={padTop}
                    x2={pt.x}
                    y2={baselineY}
                    stroke="#bd6a55"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    opacity="0.7"
                  />
                )}

                {/* Point Halo on Hover / Today */}
                {(isHovered || isToday) && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 8 : 6}
                    fill="#bd6a55"
                    fillOpacity={isHovered ? 0.28 : 0.15}
                  />
                )}

                {/* Main Dot */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 5.5 : 4}
                  fill="#ffffff"
                  stroke={isHovered ? "#bd6a55" : isToday ? "#d9a359" : "#bd6a55"}
                  strokeWidth={isHovered ? "3.5" : "2.5"}
                />
              </g>
            );
          })}

          {/* X-Axis Labels (Day name + Short date) */}
          {data.map((d, i) => {
            const pt = points[i];
            const isToday = i === data.length - 1;
            const isHovered = hoveredIdx === i;
            // Only skip labels if 30 days on small screen
            const skipLabel = days === 30 && i % 3 !== 0 && !isToday && !isHovered;
            if (skipLabel) return null;

            return (
              <g key={i}>
                <text
                  x={pt.x}
                  y={baselineY + 16}
                  textAnchor="middle"
                  fill={isHovered || isToday ? "#bd6a55" : "#78716c"}
                  fontSize="10"
                  fontWeight={isHovered || isToday ? "800" : "600"}
                  className="uppercase tracking-tight"
                >
                  {d.label}
                </text>
                <text
                  x={pt.x}
                  y={baselineY + 28}
                  textAnchor="middle"
                  fill={isHovered || isToday ? "#a8a29e" : "#a8a29e"}
                  fontSize="9"
                  fontWeight="500"
                >
                  {d.shortDate.split(" ")[0]}
                </text>
              </g>
            );
          })}

          {/* Interactive Hover Columns */}
          {points.map((pt, i) => {
            const colWidth = chartW / data.length;
            return (
              <rect
                key={i}
                x={pt.x - colWidth / 2}
                y={0}
                width={colWidth}
                height={svgHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>

        {/* Empty State Overlay if 0 sales */}
        {rawMax === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
            <div className="rounded-xl border border-dashed border-stone-300 bg-white px-4 py-2.5 text-center shadow-sm">
              <p className="text-xs font-bold text-stone-600">
                Belum ada transaksi pada periode {days} hari ini
              </p>
              <p className="text-[11px] text-stone-400">
                Garis grafik akan terisi otomatis saat transaksi kasir tersimpan
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
