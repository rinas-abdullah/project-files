import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Ambulance, ClipboardList, MapPin, UserPlus } from "lucide-react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getDict } from "@/lib/i18n";
import { formatDateTime } from "@/lib/i18n/format";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AmbulanceStatusBadge, EncounterStatusBadge, PriorityBadge, T } from "@/components/shared/status";
import { NewMissionForm, OnSceneButton } from "@/components/paramedic/mission";
import { CreatePatientDialog } from "@/components/paramedic/actions";
import { LiveRefresh } from "@/components/live-provider";

export default async function ParamedicHome({ searchParams }: { searchParams: Promise<{ stay?: string }> }) {
  const user = await requireUser();
  if (user.role !== "PARAMEDIC") notFound();
  const { t, locale } = await getDict();
  const { stay } = await searchParams;
  if (!user.ambulanceId) return <PageHeader title={t.paramedic.title} subtitle={t.errors.NO_AMBULANCE} />;

  const [ambulance, mission, recent] = await Promise.all([
    prisma.ambulance.findUniqueOrThrow({ where: { id: user.ambulanceId } }),
    prisma.ambulanceMission.findFirst({
      where: { ambulanceId: user.ambulanceId, releasedAt: null, status: { not: "CANCELLED" } },
      orderBy: { dispatchedAt: "desc" },
      include: { incident: true, encounters: { include: { patient: true }, orderBy: { createdAt: "desc" } } },
    }),
    prisma.ambulanceMission.findMany({
      where: { ambulanceId: user.ambulanceId, releasedAt: { not: null } },
      orderBy: { dispatchedAt: "desc" },
      take: 5,
      include: { incident: true, encounters: { include: { patient: true } } },
    }),
  ]);

  if (mission && mission.encounters.length && !stay) {
    const open = mission.encounters.find((e) => !["COMPLETED", "CANCELLED"].includes(e.status)) ?? mission.encounters[0];
    redirect(`/paramedic/${open.id}`);
  }

  return (
    <div className="space-y-5">
      <LiveRefresh />
      <PageHeader
        eyebrow={t.paramedic.title}
        title={
          <span className="flex items-center gap-3">
            <Ambulance className="size-6 text-critical" /> <span className="ltr">{ambulance.callSign}</span>
          </span>
        }
        subtitle={`${ambulance.unitType} · ${ambulance.baseName}`}
        actions={<AmbulanceStatusBadge s={ambulance.status} />}
      />
      {!mission ? (
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="text-base">{t.paramedic.noMission}</CardTitle>
              <CardDescription className="mt-1">{t.paramedic.noMissionHint}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <NewMissionForm />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-red-200">
          <CardHeader>
            <div>
              <CardTitle className="text-base">{mission.status === "DISPATCHED" ? t.paramedic.dispatched : t.paramedic.currentMission}</CardTitle>
              <CardDescription className="mt-1 ltr text-start">{mission.code} · {mission.incident.code}</CardDescription>
            </div>
            <span className="text-sm font-semibold">
              <T k={`enums.incidentType.${mission.incident.type}`} />
            </span>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="size-4 text-muted-foreground" /> {mission.incident.address}
            </div>
            {mission.incident.description ? <div className="text-sm text-muted-foreground">{mission.incident.description}</div> : null}
            <div className="flex flex-wrap gap-3">
              {mission.status === "DISPATCHED" ? <OnSceneButton missionId={mission.id} /> : null}
              <CreatePatientDialog
                missionId={mission.id}
                trigger={
                  <Button size="xl" variant="critical" data-testid="action-create-patient">
                    <UserPlus /> {t.paramedic.createPatient}
                  </Button>
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="size-4" /> {t.paramedic.recentMissions}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {recent.length === 0 ? <li className="py-3 text-sm text-muted-foreground">{t.common.noData}</li> : null}
            {recent.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <div>
                  <div className="font-medium">
                    <T k={`enums.incidentType.${m.incident.type}`} /> · {m.incident.address}
                  </div>
                  <div className="text-xs text-muted-foreground">{formatDateTime(m.dispatchedAt, locale)}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {m.encounters.map((e) => (
                    <Link key={e.id} href={`/paramedic/${e.id}`} className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs hover:bg-muted">
                      <PriorityBadge p={e.priority} /> {e.patient.isUnknown ? e.patient.temporaryId : e.patient.fullName} <EncounterStatusBadge s={e.status} />
                    </Link>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
