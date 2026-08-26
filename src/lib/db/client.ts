import "server-only";
import { neon, NeonQueryFunction } from "@neondatabase/serverless";
import { drizzle, NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let cached: NeonHttpDatabase<typeof schema> | null = null;

function getDb(): NeonHttpDatabase<typeof schema> {
  if (cached) return cached;

  const connectionString =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING;

  if (!connectionString) {
    throw new Error(
      "No Postgres connection string found. Set POSTGRES_URL (added automatically when you connect a Vercel Postgres/Neon database to this project)."
    );
  }

  const sql: NeonQueryFunction<false, false> = neon(connectionString);
  cached = drizzle(sql, { schema });
  return cached;
}

// A Proxy so `db.select()...` still reads naturally at call sites, but the
// real connection (and its env var check) is only created on first actual
// use — not at module-import time, which would otherwise crash `next build`
// page-data collection whenever no database is configured yet.
export const db: NeonHttpDatabase<typeof schema> = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});
