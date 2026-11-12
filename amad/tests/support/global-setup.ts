import { execSync } from "node:child_process";

/** Applies migrations to the dedicated test database before integration tests run. */
export default function setup() {
  const url = process.env.TEST_DATABASE_URL ?? "postgresql://amad:amad_dev_pw@127.0.0.1:5432/amad_test?schema=public";
  execSync("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: url }, stdio: "pipe" });
}
