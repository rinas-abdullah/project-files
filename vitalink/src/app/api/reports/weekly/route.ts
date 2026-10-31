import { NextResponse } from "next/server";
import { route } from "@/lib/api";
import { weekStart, weeklyReport } from "@/lib/services/metrics";
import { audit } from "@/lib/audit";

export const GET = route({ permission: "reports:read" }, async ({ user, req }) => {
  const w = req.nextUrl.searchParams.get("week");
  const start = w && /^\d{4}-\d{2}-\d{2}$/.test(w) ? weekStart(new Date(`${w}T00:00:00Z`)) : weekStart(new Date());
  const r = await weeklyReport(user, start);
  await audit({ id: user.id, email: user.email, role: user.role, organizationId: user.organizationId }, "report.exported", "Report", start.toISOString().slice(0, 10));
  if (req.nextUrl.searchParams.get("format") !== "csv") return r;
  const lines = [["metric", "this_week", "previous_week", "unit"].join(","), ...r.rows.map((x) => [x.key, x.cur ?? "", x.prev ?? "", x.unit].join(",")), "", ["hospital", "incoming", "avg_ack_min", "avg_handover_min", "constraints", "diversions", "critical"].join(","), ...r.hospitals.map((h) => [JSON.stringify(h.name), h.incoming, h.avgAckMin ?? "", h.avgHandoverMin ?? "", h.constraints, h.diversions, h.critical].join(","))];
  return new NextResponse(lines.join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="vitalink-weekly-${start.toISOString().slice(0, 10)}.csv"` },
  });
});
