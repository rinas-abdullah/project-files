import { db } from "@/server/db";
import { register, resolveSession } from "@/server/auth/service";
import type { Actor } from "@/server/auth/rbac";
import type { Role } from "@/generated/prisma/enums";
import { hashPassword } from "@/server/auth/service";
import { containmentGaps } from "@/domain/engine/simulation";
import type { ScenarioDefinition, SimState } from "@/domain/engine/types";

export const META = { ip: "127.0.0.1", userAgent: "vitest" };
export const PASSWORD = "Str0ngPassw0rd!";

let n = 0;
export async function newOrgAdmin(orgName = "Org"): Promise<Actor> {
  n++;
  const r = await register({ name: `Admin ${n}`, email: `admin${n}-${Date.now()}@test.local`, password: PASSWORD, orgName, orgKind: "ENTERPRISE" }, META);
  return (await resolveSession(r.token))!;
}

/** Adds a member with a given role to the admin's organization and returns their actor. */
export async function addMember(admin: Actor, role: Role): Promise<Actor> {
  n++;
  const user = await db.user.create({ data: { email: `${role.toLowerCase()}${n}-${Date.now()}@test.local`, name: `${role} ${n}`, passwordHash: await hashPassword(PASSWORD) } });
  await db.membership.create({ data: { userId: user.id, orgId: admin.orgId, role } });
  const { createSession } = await import("@/server/auth/service");
  const token = await createSession(user.id, admin.orgId, META);
  return (await resolveSession(token))!;
}

/**
 * Test-only "oracle defender": reads the hidden state to pick correct actions.
 * Used to drive the loop deterministically regardless of the random seed.
 */
export function oracleCommands(def: ScenarioDefinition, state: SimState): string[] {
  const cmds: string[] = [];
  for (const g of containmentGaps(def, state)) {
    const [type, rest] = g.split(":");
    if (type === "c2") cmds.push(`block ${rest.split("@")[0]}`);
    if (type === "asset") cmds.push(`image ${rest}`, `isolate ${rest}`);
    if (type === "identity") cmds.push(`disable ${rest}`);
  }
  for (const [id, a] of Object.entries(state.assets)) if (a.compromised && !a.imaged && !cmds.includes(`image ${id}`)) cmds.push(`image ${id}`);
  cmds.push("contain");
  return cmds;
}
