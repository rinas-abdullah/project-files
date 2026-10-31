import Link from "next/link";
import { Download } from "lucide-react";
import { requirePermission } from "@/lib/session";
import { getDict } from "@/lib/i18n";
import { formatDateTime } from "@/lib/i18n/format";
import { weekStart, weeklyReport } from "@/lib/services/metrics";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { DailyStack } from "@/components/charts/charts";
import { PrintButton } from "./print-button";
import { cn } from "@/lib/utils";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const user = await requirePermission("reports:read");
  const { t, locale } = await getDict();
  const { week } = await searchParams;
  const current = weekStart(new Date());
  const start = week && /^\d{4}-\d{2}-\d{2}$/.test(week) ? weekStart(new Date(`${week}T00:00:00Z`)) : current;
  const r = await weeklyReport(user, start);
  const weeks = Array.from({ length: 8 }, (_, i) => new Date(current.getTime() - i * 7 * 86400_000));
  const label = (k: string) => (t.analytics as Record<string, unknown>)[k] as string ?? (t.reports as Record<string, unknown>)[k] as string ?? k;
  const labels: Record<string, string> = { avgEta: t.analytics.avgTransport, avgAck: t.analytics.avgAck, avgHandover: t.analytics.avgHandover };
  const iso = start.toISOString().slice(0, 10);
  return (
    <div className="space-y-5">
      <PageHeader
        title={t.reports.title}
        subtitle={`${formatDateTime(r.start, locale, { dateStyle: "long", timeStyle: undefined })} → ${formatDateTime(new Date(r.end.getTime() - 1), locale, { dateStyle: "long", timeStyle: undefined })}`}
        actions={
          <div className="no-print flex gap-2">
            <a href={`/api/reports/weekly?week=${iso}&format=csv`} className="inline-flex h-9 items-center gap-2 rounded-lg border bg-white px-3 text-sm font-medium hover:bg-muted" data-testid="report-csv">
              <Download className="size-4" /> {t.reports.csv}
            </a>
            <PrintButton />
          </div>
        }
      />
      <div className="no-print flex flex-wrap gap-1">
        {weeks.map((w) => {
          const k = w.toISOString().slice(0, 10);
          return (
            <Link key={k} href={`/reports?week=${k}`} className={cn("rounded-lg border px-3 py-1.5 text-xs", k === iso ? "bg-navy-900 text-white" : "bg-white hover:bg-muted")}>
              {formatDateTime(w, locale, { dateStyle: "medium", timeStyle: undefined })}
            </Link>
          );
        })}
      </div>
      <Badge variant="muted">{t.reports.generated}</Badge>
      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardContent className="p-0">
            <Table data-testid="weekly-report">
              <THead>
                <TR>
                  <TH>{t.reports.metric}</TH>
                  <TH>{t.reports.thisWeek}</TH>
                  <TH>{t.reports.previousWeek}</TH>
                  <TH>{t.reports.change}</TH>
                </TR>
              </THead>
              <TBody>
                {r.rows.map((row) => {
                  const delta = row.cur != null && row.prev != null ? Math.round((row.cur - row.prev) * 10) / 10 : null;
                  const unit = row.unit === "min" ? ` ${t.common.min}` : row.unit;
                  return (
                    <TR key={row.key}>
                      <TD className="font-medium">{labels[row.key] ?? label(row.key)}</TD>
                      <TD className="ltr font-semibold tabular">{row.cur ?? "—"}{row.cur != null ? unit : ""}</TD>
                      <TD className="ltr tabular text-muted-foreground">{row.prev ?? "—"}{row.prev != null ? unit : ""}</TD>
                      <TD className={cn("ltr tabular text-xs", delta == null ? "" : delta > 0 ? "text-info" : delta < 0 ? "text-amber-700" : "")}>{delta == null ? "—" : `${delta > 0 ? "+" : ""}${delta}`}</TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </CardContent>
        </Card>
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>{t.analytics.casesPerDay}</CardTitle>
            </CardHeader>
            <CardContent>
              <DailyStack data={r.days} labels={{ other: `${t.analytics.cases} (P2–P4)`, critical: `${t.analytics.criticalCases} (P1)` }} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t.analytics.views.hospitals}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <THead>
                  <TR>
                    <TH>{t.analytics.hospital}</TH>
                    <TH>{t.analytics.cases}</TH>
                    <TH>{t.analytics.avgAck}</TH>
                    <TH>{t.analytics.avgHandover}</TH>
                    <TH>{t.analytics.diversions}</TH>
                  </TR>
                </THead>
                <TBody>
                  {r.hospitals.map((h) => (
                    <TR key={h.id}>
                      <TD>{locale === "ar" ? h.nameAr : h.name}</TD>
                      <TD className="tabular">{h.incoming}</TD>
                      <TD className="tabular">{h.avgAckMin ?? "—"}</TD>
                      <TD className="tabular">{h.avgHandoverMin ?? "—"}</TD>
                      <TD className="tabular">{h.diversions}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
