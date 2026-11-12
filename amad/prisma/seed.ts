/**
 * Development seed. Idempotent.
 *  - Always: competencies + the authored scenario catalog (PUBLISHED, source=AUTHORED).
 *  - Only with AMAD_DEMO_MODE=true: a clearly labelled demo organization with
 *    demo accounts. Demo accounts start with NO training history — nothing is
 *    pre-filled; every score shown in the app comes from sessions actually played.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { COMPETENCIES, SCENARIOS } from "../src/domain/scenarios/catalog";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

export async function seedCatalog(client: PrismaClient = db) {
  for (const c of COMPETENCIES) {
    await client.competency.upsert({ where: { key: c.key }, create: { key: c.key, nameAr: c.nameAr, nameEn: c.nameEn }, update: { nameAr: c.nameAr, nameEn: c.nameEn } });
  }
  const comps = await client.competency.findMany();
  for (const s of SCENARIOS) {
    const data = {
      titleAr: s.titleAr,
      titleEn: s.titleEn,
      briefingAr: s.briefingAr,
      difficulty: s.difficulty,
      status: "PUBLISHED" as const,
      source: "AUTHORED" as const,
      definition: JSON.parse(JSON.stringify(s)),
      attackRefs: s.attackRefs,
      publishedAt: new Date(),
    };
    const row = await client.scenario.upsert({ where: { key_version: { key: s.key, version: 1 } }, create: { key: s.key, version: 1, ...data }, update: data });
    await client.scenarioCompetency.deleteMany({ where: { scenarioId: row.id } });
    await client.scenarioCompetency.createMany({
      data: Object.entries(s.competencies).map(([key, weight]) => ({ scenarioId: row.id, competencyId: comps.find((c) => c.key === key)!.id, weight })),
    });
  }
}

async function seedDemo() {
  const password = process.env.AMAD_DEMO_PASSWORD;
  if (!password || password.length < 10) throw new Error("Set AMAD_DEMO_PASSWORD (>= 10 chars) to seed demo accounts.");
  const hash = await bcrypt.hash(password, 12);
  const org = await db.organization.upsert({
    where: { slug: "amad-demo" },
    create: { name: "منظمة تجريبية — AMAD Demo", slug: "amad-demo", kind: "ENTERPRISE", isDemo: true },
    update: {},
  });
  const users = [
    { email: "admin@demo.amad.local", name: "مسؤول تجريبي", role: "ORG_ADMIN" as const },
    { email: "trainee@demo.amad.local", name: "متدرب تجريبي", role: "TRAINEE" as const },
    { email: "auditor@demo.amad.local", name: "مدقق تجريبي", role: "AUDITOR" as const },
  ];
  for (const u of users) {
    const user = await db.user.upsert({ where: { email: u.email }, create: { email: u.email, name: u.name, passwordHash: hash }, update: { passwordHash: hash } });
    await db.membership.upsert({ where: { userId_orgId: { userId: user.id, orgId: org.id } }, create: { userId: user.id, orgId: org.id, role: u.role }, update: { role: u.role } });
  }
  console.log(`Demo org seeded: ${users.map((u) => u.email).join(", ")} (password from AMAD_DEMO_PASSWORD)`);
}

async function main() {
  await seedCatalog();
  console.log(`Catalog seeded: ${COMPETENCIES.length} competencies, ${SCENARIOS.length} scenarios.`);
  if (process.env.AMAD_DEMO_MODE === "true") await seedDemo();
}

if (process.argv[1]?.endsWith("seed.ts")) {
  main()
    .then(() => db.$disconnect())
    .catch(async (e) => {
      console.error(e);
      await db.$disconnect();
      process.exit(1);
    });
}
