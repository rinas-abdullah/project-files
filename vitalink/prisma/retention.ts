/**
 * Applies the data retention policy (see src/lib/engines/retention.ts).
 *   npm run retention           -> dry run, prints what would be removed
 *   npm run retention -- --apply
 * Run daily from the scheduler of the hosting environment.
 */
import { PrismaClient } from "@prisma/client";
import { rm } from "node:fs/promises";
import path from "node:path";
import { CLOSED_STATUSES, cutoff, policyFromEnv, RETENTION_ENGINE_VERSION } from "../src/lib/engines/retention";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");
const MEDIA_DIR = process.env.MEDIA_DIR ?? path.join(process.cwd(), "storage", "media");

async function main() {
  const now = new Date();
  const policy = policyFromEnv(process.env);
  const closed = { in: [...CLOSED_STATUSES] };

  const mediaEnc = await prisma.patientEncounter.findMany({
    where: { status: closed, closedAt: { lte: cutoff(now, policy.mediaDays) }, media: { some: {} } },
    select: { id: true, _count: { select: { media: true } } },
  });
  const idEnc = await prisma.patientEncounter.findMany({
    where: { status: closed, closedAt: { lte: cutoff(now, policy.identifierDays) } },
    select: { id: true, patientId: true },
  });
  // A patient is de-identified only when none of their encounters is still open or inside the window.
  const candidatePatients = [...new Set(idEnc.map((e) => e.patientId))];
  const blocked = await prisma.patientEncounter.findMany({
    where: { patientId: { in: candidatePatients }, OR: [{ status: { notIn: [...CLOSED_STATUSES] } }, { closedAt: null }, { closedAt: { gt: cutoff(now, policy.identifierDays) } }] },
    select: { patientId: true },
  });
  const blockedSet = new Set(blocked.map((b) => b.patientId));
  const patients = candidatePatients.filter((p) => !blockedSet.has(p));
  const auditCut = cutoff(now, policy.auditDays);
  const auditCount = await prisma.auditEvent.count({ where: { createdAt: { lt: auditCut } } });

  console.log(`[retention ${RETENTION_ENGINE_VERSION}] policy`, policy, apply ? "APPLY" : "DRY RUN");
  console.log(`  media: ${mediaEnc.reduce((n, e) => n + e._count.media, 0)} files in ${mediaEnc.length} encounters`);
  console.log(`  identifiers: ${patients.length} patients, free text in ${idEnc.length} encounters`);
  console.log(`  audit events older than ${policy.auditDays} days: ${auditCount}`);
  if (!apply) return;

  for (const e of mediaEnc) {
    if (!/^[a-z0-9]+$/i.test(e.id)) continue;
    await rm(path.join(MEDIA_DIR, e.id), { recursive: true, force: true });
    await prisma.mediaAttachment.deleteMany({ where: { encounterId: e.id } });
  }
  await prisma.patientEncounter.updateMany({ where: { id: { in: idEnc.map((e) => e.id) } }, data: { notes: null, registrationRef: null } });
  await prisma.healthProfile.deleteMany({ where: { patientId: { in: patients } } });
  await prisma.patientIdentity.updateMany({ where: { patientId: { in: patients } }, data: { externalRef: null, message: null } });
  await prisma.patient.updateMany({
    where: { id: { in: patients } },
    data: { fullName: null, nationalIdEnc: null, nationalIdHash: null, nationalIdLast4: null, phoneEnc: null, phoneLast4: null },
  });
  await prisma.auditEvent.deleteMany({ where: { createdAt: { lt: auditCut } } });
  await prisma.auditEvent.create({
    data: { userEmail: "system", action: "RETENTION_APPLIED", entityType: "System", after: { policy, media: mediaEnc.length, patients: patients.length, audit: auditCount } },
  });
  console.log("  done");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
