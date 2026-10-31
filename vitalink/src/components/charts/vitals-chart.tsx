"use client";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceArea } from "recharts";
import { useI18n } from "@/components/i18n-provider";
import { SERIES, INK } from "./palette";

export type VitalPoint = { type: string; value: number; value2: number | null; at: string };

const PANELS: { type: string; domain: [number, number]; normal: [number, number]; unit: string }[] = [
  { type: "HEART_RATE", domain: [30, 180], normal: [50, 110], unit: "bpm" },
  { type: "SPO2", domain: [75, 100], normal: [94, 100], unit: "%" },
  { type: "BLOOD_PRESSURE", domain: [40, 220], normal: [100, 160], unit: "mmHg" },
  { type: "RESPIRATORY_RATE", domain: [0, 45], normal: [12, 22], unit: "/min" },
];

function tickTime(v: number) {
  return new Date(v).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Riyadh" });
}

/** Small multiples — one panel per vital, single y-axis each (never dual-axis). */
export function VitalsChart({ points, compact }: { points: VitalPoint[]; compact?: boolean }) {
  const { t } = useI18n();
  return (
    <div className={compact ? "grid gap-3 sm:grid-cols-2" : "grid gap-4 md:grid-cols-2"} data-testid="vitals-chart">
      {PANELS.map((p) => {
        const data = points
          .filter((x) => x.type === p.type)
          .map((x) => ({ ts: new Date(x.at).getTime(), v: x.value, v2: x.value2 }))
          .sort((a, b) => a.ts - b.ts);
        const isBp = p.type === "BLOOD_PRESSURE";
        const last = data[data.length - 1];
        return (
          <div key={p.type} className="rounded-lg border bg-white p-3">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">
                {t.enums.vital[p.type as keyof typeof t.enums.vital]} <span className="font-normal text-muted-foreground">({p.unit})</span>
              </span>
              {isBp ? (
                <span className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="inline-block h-0.5 w-3" style={{ background: SERIES[0] }} /> SYS</span>
                  <span className="flex items-center gap-1"><span className="inline-block h-0.5 w-3" style={{ background: SERIES[1] }} /> DIA</span>
                </span>
              ) : last ? (
                <span className="ltr font-semibold tabular text-foreground">{Math.round(last.v)}</span>
              ) : null}
            </div>
            {data.length === 0 ? (
              <div className="flex h-28 items-center justify-center text-xs text-muted-foreground">{t.common.noData}</div>
            ) : (
              <div dir="ltr" className={compact ? "h-28" : "h-40"}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -18 }}>
                    <CartesianGrid stroke={INK.grid} vertical={false} />
                    <ReferenceArea y1={p.normal[0]} y2={p.normal[1]} fill="#0d9488" fillOpacity={0.06} stroke="none" />
                    <XAxis dataKey="ts" type="number" domain={["dataMin", "dataMax"]} scale="time" tickFormatter={tickTime} tick={{ fontSize: 10, fill: INK.secondary }} stroke={INK.grid} minTickGap={30} />
                    <YAxis domain={p.domain} tick={{ fontSize: 10, fill: INK.secondary }} stroke={INK.grid} width={40} />
                    <Tooltip
                      labelFormatter={(v) => tickTime(Number(v))}
                      formatter={(value, name) => [Math.round(Number(value)), name === "v2" ? "DIA" : isBp ? "SYS" : t.enums.vitalShort[p.type as keyof typeof t.enums.vitalShort]]}
                      contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: INK.grid }}
                    />
                    <Line type="monotone" dataKey="v" stroke={SERIES[0]} strokeWidth={2} dot={data.length < 12 ? { r: 3 } : false} isAnimationActive={false} />
                    {isBp ? <Line type="monotone" dataKey="v2" stroke={SERIES[1]} strokeWidth={2} dot={data.length < 12 ? { r: 3 } : false} isAnimationActive={false} /> : null}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
