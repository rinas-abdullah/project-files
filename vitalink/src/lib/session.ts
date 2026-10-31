import "server-only";
import { cache } from "react";
import { redirect, notFound } from "next/navigation";
import type { RoleKey } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { can, type Permission } from "@/lib/rbac";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: RoleKey;
  organizationId: string;
  organizationName: string;
  orgType: "PLATFORM" | "EMS" | "HOSPITAL";
  hospitalId: string | null;
  hospitalName: string | null;
  ambulanceId: string | null;
  ambulanceCallSign: string | null;
};

/** Reads the session and re-validates the user against the database on every request. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  const u = await prisma.user.findUnique({
    where: { id },
    include: { organization: true, hospital: true, ambulance: true },
  });
  if (!u || !u.active) return null;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    organizationId: u.organizationId,
    organizationName: u.organization.name,
    orgType: u.organization.type,
    hospitalId: u.hospitalId,
    hospitalName: u.hospital?.name ?? null,
    ambulanceId: u.ambulanceId,
    ambulanceCallSign: u.ambulance?.callSign ?? null,
  };
});

export async function requireUser(): Promise<CurrentUser> {
  const u = await getCurrentUser();
  if (!u) redirect("/login");
  return u;
}

export async function requirePermission(p: Permission): Promise<CurrentUser> {
  const u = await requireUser();
  if (!can(u.role, p)) notFound();
  return u;
}
