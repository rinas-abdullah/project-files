import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Arena } from "@/components/arena/arena";
import { Forensics } from "@/components/arena/forensics";
import { Report } from "@/components/arena/report";
import { db } from "@/server/db";
import { can } from "@/server/auth/rbac";
import { requireActor } from "@/server/auth/session";
import { sessionView } from "@/server/services/simulation";
import { arenaView, forensicsView } from "@/server/services/views";

export const metadata: Metadata = { title: "جلسة تدريب" };

export default async function SessionPage({ params }: PageProps<"/app/sessions/[id]">) {
  const { id } = await params;
  const actor = await requireActor();
  const v = await sessionView(actor, id).catch((e: { status?: number }) => {
    if (e.status === 404) notFound();
    throw e;
  });

  if (v.session.phase === "SIMULATION") return <Arena data={arenaView(v)} sessionId={id} />;
  if (v.session.phase === "FORENSICS") return <Forensics data={forensicsView(v)} sessionId={id} />;

  const [recommendation, competencies] = await Promise.all([
    db.trainingRecommendation.findFirst({ where: { sourceSessionId: id, orgId: actor.orgId }, include: { scenario: { select: { titleAr: true, difficulty: true } } } }),
    db.competency.findMany(),
  ]);
  if (!v.readiness || !v.report) notFound();
  return <Report v={v} recommendation={recommendation} competencyNames={Object.fromEntries(competencies.map((c) => [c.key, c.nameAr]))} canRun={can(actor, "simulation:run")} />;
}
