import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getDict } from "@/lib/i18n";
import { formatDateTime } from "@/lib/i18n/format";
import { encounterScope } from "@/lib/scope";
import { maskId } from "@/lib/crypto";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EncounterStatusBadge, PriorityBadge } from "@/components/shared/status";
import { Progress } from "@/components/ui/progress";
import { LiveRefresh } from "@/components/live-provider";

const STATUSES = ["CREATED", "ACTIVE", "PRE_ALERT_SENT", "ACKNOWLEDGED", "PREPARING", "APPROACHING", "ARRIVED", "HANDOVER", "COMPLETED", "CANCELLED", "DIVERTED"] as const;

export default async function CasesPage({ searchParams }: { searchParams: Promise<{ status?: string; priority?: string; q?: string; page?: string }> }) {
  const user = await requirePermission("case:read");
  const { t, locale } = await getDict();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const where: Prisma.PatientEncounterWhereInput = {
    AND: [
      encounterScope(user),
      sp.status && (STATUSES as readonly string[]).includes(sp.status) ? { status: sp.status as (typeof STATUSES)[number] } : {},
      sp.priority && ["P1", "P2", "P3", "P4"].includes(sp.priority) ? { priority: sp.priority as "P1" } : {},
      sp.q ? { OR: [{ code: { contains: sp.q, mode: "insensitive" } }, { patient: { fullName: { contains: sp.q, mode: "insensitive" } } }, { patient: { temporaryId: { contains: sp.q, mode: "insensitive" } } }, { chiefComplaint: { contains: sp.q, mode: "insensitive" } }] } : {},
    ],
  };
  const [rows, total] = await Promise.all([
    prisma.patientEncounter.findMany({ where, include: { patient: true, destinationHospital: true, mission: { include: { ambulance: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * 50, take: 50 }),
    prisma.patientEncounter.count({ where }),
  ]);
  const qs = (p: number) => `?${new URLSearchParams({ ...(sp.status ? { status: sp.status } : {}), ...(sp.priority ? { priority: sp.priority } : {}), ...(sp.q ? { q: sp.q } : {}), page: String(p) })}`;
  return (
    <div className="space-y-4">
      <LiveRefresh types={["encounter", "prealert", "ack", "arrived", "handover", "destination", "priority"]} />
      <PageHeader title={t.cases.title} subtitle={`${total}`} />
      <form className="flex flex-wrap gap-2">
        <Input name="q" defaultValue={sp.q} placeholder={t.common.search} className="max-w-xs" />
        <Select name="status" defaultValue={sp.status ?? ""} className="max-w-48">
          <option value="">{t.common.status}: {t.common.all}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {t.enums.encounterStatus[s]}
            </option>
          ))}
        </Select>
        <Select name="priority" defaultValue={sp.priority ?? ""} className="max-w-40">
          <option value="">{t.caseView.priority}: {t.common.all}</option>
          {["P1", "P2", "P3", "P4"].map((p) => (
            <option key={p}>{p}</option>
          ))}
        </Select>
        <Button type="submit" variant="outline">
          {t.common.filter}
        </Button>
      </form>
      <Card>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>{t.cases.code}</TH>
                <TH>{t.caseView.patient}</TH>
                <TH>{t.caseView.nationalId}</TH>
                <TH>{t.caseView.priority}</TH>
                <TH>{t.common.status}</TH>
                <TH>{t.caseView.chiefComplaint}</TH>
                <TH>{t.caseView.hospital}</TH>
                <TH>{t.caseView.ambulance}</TH>
                <TH>{t.cases.created}</TH>
                <TH>{t.cases.completeness}</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((e) => (
                <TR key={e.id}>
                  <TD>
                    <Link href={`/cases/${e.id}`} className="ltr font-mono text-xs font-semibold text-info hover:underline">
                      {e.code}
                    </Link>
                  </TD>
                  <TD className="ltr whitespace-nowrap">{e.patient.isUnknown ? e.patient.temporaryId : e.patient.fullName}</TD>
                  <TD className="ltr font-mono text-xs">{maskId(e.patient.nationalIdLast4)}</TD>
                  <TD>
                    <PriorityBadge p={e.priority} />
                  </TD>
                  <TD>
                    <EncounterStatusBadge s={e.status} />
                  </TD>
                  <TD className="max-w-64 truncate text-xs">{e.chiefComplaint}</TD>
                  <TD className="whitespace-nowrap text-xs">{e.destinationHospital ? (locale === "ar" ? e.destinationHospital.nameAr : e.destinationHospital.name) : "—"}</TD>
                  <TD className="ltr text-xs">{e.mission.ambulance.callSign}</TD>
                  <TD className="whitespace-nowrap text-xs tabular">{formatDateTime(e.createdAt, locale)}</TD>
                  <TD className="w-28">
                    <div className="flex items-center gap-2 text-xs tabular">
                      <Progress value={e.completeness} tone={e.completeness >= 75 ? "stable" : "warning"} /> {e.completeness}%
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {t.common.page} {page} / {Math.max(1, Math.ceil(total / 50))}
        </span>
        <div className="flex gap-2">
          {page > 1 ? (
            <Link href={qs(page - 1)} className="rounded-lg border px-3 py-1.5 hover:bg-muted">
              {t.common.previous}
            </Link>
          ) : null}
          {page * 50 < total ? (
            <Link href={qs(page + 1)} className="rounded-lg border px-3 py-1.5 hover:bg-muted">
              {t.common.next}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
