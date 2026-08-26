import "server-only";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db/client";
import { users as usersTable } from "@/lib/db/schema";
import { SessionUser } from "./session";

function toSessionUser(row: typeof usersTable.$inferSelect): SessionUser {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    email: row.email,
    mrn: row.mrn ?? undefined,
    department: row.department ?? undefined,
    hospital: row.hospital ?? undefined,
    deviceId: row.deviceId ?? undefined,
  };
}

export async function verifyCredentials(identifier: string, password: string): Promise<SessionUser | null> {
  const normalized = identifier.trim().toLowerCase();

  const [row] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, normalized));

  if (!row) return null;

  const valid = await bcrypt.compare(password, row.passwordHash);
  if (!valid) return null;

  return toSessionUser(row);
}
