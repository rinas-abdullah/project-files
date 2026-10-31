"use client";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, Legend } from "recharts";
import { SERIES, INK, PRIORITY_COLOR } from "./palette";

const tooltipStyle = { fontSize: 12, borderRadius: 8, borderColor: INK.grid };

/** Single-series column chart (one hue). Optional per-category color for status-like keys (priority). */
export function ColumnChart({ data, height = 220, colorBy, label, testId }: { data: { key: string; value: number }[]; height?: number; colorBy?: "priority"; label?: string; testId?: string }) {
  return (
    <div dir="ltr" style={{ height }} data-testid={testId}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }} barCategoryGap="22%">
          <CartesianGrid stroke={INK.grid} vertical={false} />
          <XAxis dataKey="key" tick={{ fontSize: 10, fill: INK.secondary }} stroke={INK.grid} interval="preserveStartEnd" />
          <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: INK.secondary }} stroke={INK.grid} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(11,26,51,0.04)" }} formatter={(v) => [v as number, label ?? ""]} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} fill={SERIES[0]} isAnimationActive={false}>
            {colorBy === "priority" ? data.map((d) => <Cell key={d.key} fill={PRIORITY_COLOR[d.key] ?? SERIES[0]} />) : null}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Horizontal bars for ranked categories. */
export function BarList({ data, height, label, format }: { data: { key: string; label?: string; value: number }[]; height?: number; label?: string; format?: (v: number) => string }) {
  return (
    <div dir="ltr" style={{ height: height ?? Math.max(120, data.length * 34 + 20) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data.map((d) => ({ ...d, name: d.label ?? d.key }))} layout="vertical" margin={{ top: 4, right: 24, bottom: 0, left: 8 }} barCategoryGap="25%">
          <CartesianGrid stroke={INK.grid} horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: INK.secondary }} stroke={INK.grid} allowDecimals={false} />
          <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11, fill: INK.primary }} stroke={INK.grid} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(11,26,51,0.04)" }} formatter={(v) => [format ? format(v as number) : (v as number), label ?? ""]} />
          <Bar dataKey="value" fill={SERIES[0]} radius={[0, 4, 4, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Two-series stacked daily columns (e.g. all cases vs critical). */
export function DailyStack({ data, labels, height = 240 }: { data: { day: string; cases: number; critical: number }[]; labels: { other: string; critical: string }; height?: number }) {
  const rows = data.map((d) => ({ day: d.day, other: d.cases - d.critical, critical: d.critical }));
  return (
    <div dir="ltr" style={{ height }} data-testid="daily-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -20 }} barCategoryGap="18%">
          <CartesianGrid stroke={INK.grid} vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 10, fill: INK.secondary }} stroke={INK.grid} minTickGap={16} />
          <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: INK.secondary }} stroke={INK.grid} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(11,26,51,0.04)" }} />
          <Legend wrapperStyle={{ fontSize: 11 }} iconType="square" />
          <Bar dataKey="other" name={labels.other} stackId="a" fill={SERIES[0]} isAnimationActive={false} />
          <Bar dataKey="critical" name={labels.critical} stackId="a" fill={SERIES[1]} radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
