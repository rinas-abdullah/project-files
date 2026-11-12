import { db } from "@/server/db";
import { seedCatalog } from "../../prisma/seed";
import type { PrismaClient } from "@/generated/prisma/client";

const TABLES = [
  "AuditLog", "Notification", "TrainingRecommendation", "BehavioralProfile", "ReadinessScore", "InvestigationReport",
  "EvidenceRecord", "AdversaryAction", "DefenderAction", "SimulationEvent", "SimulationSession", "ScenarioCompetency",
  "Scenario", "Competency", "AuthSession", "Membership", "User", "Organization",
];

export async function resetDb() {
  if (!process.env.DATABASE_URL?.includes("amad_test")) throw new Error("Refusing to reset a non-test database");
  await db.$executeRawUnsafe(`TRUNCATE ${TABLES.map((t) => `"${t}"`).join(", ")} CASCADE`);
  await seedCatalog(db as unknown as PrismaClient);
}
