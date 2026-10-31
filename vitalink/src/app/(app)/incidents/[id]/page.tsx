import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getDict } from "@/lib/i18n";
import { formatDateTime } from "@/lib/i18n/format";
import { encounterScope } from "@/lib/scope";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AmbulanceStatusBadge, EncounterStatusBadge, PriorityBadge, T } from "@/components/shared/status";
import { LiveMap } from "@/components/maps/live-map";
import { mapHospitals } from "@/lib/queries";

export default async function IncidentDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("case:read");
  if (user.orgType === "HOSPITAL") notFound();
  const { id } = await params;
  const { t, locale } = await getDict();
  const inc = await prisma.incident.findFirst({
    where: { id, ...(user.orgType === "EMS" ? { organizationId: user.organizationId } : {}) },
    include: { missions: { include: { ambulance: true } }, encounters: { where: encounterScope(user), include: { patient: true, destinationHospital: true } } },
  });
  if (!inc) notFound();
  const hospitals = await mapHospitals();
  return (
    <div className="space-y-4">
      <PageHeader eyebrow={t.incidents.title} title={<span className="ltr">{inc.code}</span>} subtitle={`${inc.address} · ${formatDateTime(inc.reportedAt, locale)}`} actions={<span className="text-sm font-semibold"><T k={`enums.incidentType.${inc.type}`} /></span>} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.incidents.missions}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y text-sm">
              {inc.missions.map((m) => (
                <li key={m.id} className="flex items-center justify-between py-2">
                  <span className="ltr font-semibold">{m.ambulance.callSign}</span>
                  <span className="flex items-center gap-2">
                    <T k={`enums.missionStatus.${m.status}`} /> <AmbulanceStatusBadge s={m.ambulance.status} />
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t.incidents.patients}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y text-sm">
              {inc.encounters.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-2 py-2">
                  <Link href={`/cases/${e.id}`} className="flex items-center gap-2 hover:underline">
                    <PriorityBadge p={e.priority} /> <span className="ltr">{e.patient.isUnknown ? e.patient.temporaryId : e.patient.fullName}</span>
                  </Link>
                  <span className="flex items-center gap-2 text-xs">
                    {e.destinationHospital?.name ?? "—"} <EncounterStatusBadge s={e.status} />
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      <LiveMap className="h-96" hospitals={hospitals} ambulances={inc.missions.map((m) => ({ id: m.ambulance.id, callSign: m.ambulance.callSign, lat: m.ambulance.lat, lng: m.ambulance.lng, status: m.ambulance.status }))} incidents={[{ id: inc.id, lat: inc.lat, lng: inc.lng, label: inc.address }]} />
    </div>
  );
}
