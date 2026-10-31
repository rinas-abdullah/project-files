import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getDict } from "@/lib/i18n";
import { formatDateTime } from "@/lib/i18n/format";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const user = await requirePermission("audit:read");
  const { t, locale } = await getDict();
  const { q, page: p } = await searchParams;
  const page = Math.max(1, Number(p ?? 1));
  // Tenant isolation: org admins see their own organization's audit trail; platform roles see all.
  const where: Prisma.AuditEventWhereInput = {
    AND: [
      user.orgType === "PLATFORM" ? {} : { orgId: user.organizationId },
      q ? { OR: [{ action: { contains: q, mode: "insensitive" } }, { userEmail: { contains: q, mode: "insensitive" } }, { entityType: { contains: q, mode: "insensitive" } }, { entityId: q }] } : {},
    ],
  };
  const [rows, total] = await Promise.all([prisma.auditEvent.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * 50, take: 50 }), prisma.auditEvent.count({ where })]);
  const short = (v: unknown) => (v == null ? "" : JSON.stringify(v).slice(0, 140));
  return (
    <div className="space-y-4">
      <PageHeader title={t.audit.title} subtitle={`${total}`} />
      <form className="flex gap-2">
        <Input name="q" defaultValue={q} placeholder={`${t.common.search} (action, user, entity)`} className="max-w-sm" />
        <Button variant="outline" type="submit">
          {t.common.filter}
        </Button>
      </form>
      <Card>
        <CardContent className="p-0">
          <Table data-testid="audit-table">
            <THead>
              <TR>
                <TH>{t.common.time}</TH>
                <TH>{t.audit.user}</TH>
                <TH>{t.audit.action}</TH>
                <TH>{t.audit.entity}</TH>
                <TH>{t.audit.before}</TH>
                <TH>{t.audit.after}</TH>
                <TH>{t.audit.ip}</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((a) => (
                <TR key={a.id}>
                  <TD className="whitespace-nowrap text-xs tabular">{formatDateTime(a.createdAt, locale, { timeStyle: "medium" })}</TD>
                  <TD className="text-xs">
                    <div className="ltr">{a.userEmail ?? "system"}</div>
                    {a.role ? <div className="text-muted-foreground">{t.roles[a.role]}</div> : null}
                  </TD>
                  <TD className="ltr font-mono text-xs font-semibold">{a.action}</TD>
                  <TD className="ltr text-xs">
                    {a.entityType}
                    {a.entityId ? (
                      a.entityType === "PatientEncounter" ? (
                        <Link className="block text-info hover:underline" href={`/cases/${a.entityId}`}>
                          {a.entityId.slice(0, 10)}…
                        </Link>
                      ) : (
                        <div className="text-muted-foreground">{a.entityId.slice(0, 10)}…</div>
                      )
                    ) : null}
                  </TD>
                  <TD className="ltr max-w-56 truncate font-mono text-[10px] text-muted-foreground">{short(a.before)}</TD>
                  <TD className="ltr max-w-56 truncate font-mono text-[10px] text-muted-foreground">{short(a.after)}</TD>
                  <TD className="ltr text-[11px] text-muted-foreground">{a.ip}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
      <div className="flex justify-end gap-2 text-sm">
        {page > 1 ? <Link className="rounded-lg border px-3 py-1.5" href={`?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page - 1) })}`}>{t.common.previous}</Link> : null}
        {page * 50 < total ? <Link className="rounded-lg border px-3 py-1.5" href={`?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page + 1) })}`}>{t.common.next}</Link> : null}
      </div>
    </div>
  );
}
