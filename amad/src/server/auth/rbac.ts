import type { Role } from "@/generated/prisma/enums";

/**
 * Role-based access control. Enforced in the service layer on every call —
 * UI visibility is a convenience only.
 */
export type Permission =
  | "simulation:run"
  | "simulation:view-own"
  | "team:view"
  | "audit:view"
  | "org:manage";

const MATRIX: Record<Role, Permission[]> = {
  ORG_ADMIN: ["simulation:run", "simulation:view-own", "team:view", "audit:view", "org:manage"],
  SECURITY_MANAGER: ["simulation:run", "simulation:view-own", "team:view", "audit:view"],
  INSTRUCTOR: ["simulation:run", "simulation:view-own", "team:view"],
  TRAINEE: ["simulation:run", "simulation:view-own"],
  AUDITOR: ["simulation:view-own", "team:view", "audit:view"],
};

export const ROLE_LABEL_AR: Record<Role, string> = {
  ORG_ADMIN: "مسؤول المنظمة",
  SECURITY_MANAGER: "مدير الأمن",
  INSTRUCTOR: "مدرّب",
  TRAINEE: "متدرّب",
  AUDITOR: "مدقق (قراءة فقط)",
};

export interface Actor {
  userId: string;
  orgId: string;
  role: Role;
  isSuperAdmin: boolean;
  name: string;
  email: string;
  orgName: string;
  orgIsDemo: boolean;
  sessionId: string;
}

export function can(actor: Pick<Actor, "role">, permission: Permission): boolean {
  return MATRIX[actor.role].includes(permission);
}

export class AuthorizationError extends Error {
  readonly status = 403;
  constructor(public readonly permission: string) {
    super(`forbidden:${permission}`);
  }
}

export class NotFoundError extends Error {
  readonly status = 404;
  constructor(what = "resource") {
    super(`not-found:${what}`);
  }
}

export class ConflictError extends Error {
  readonly status = 409;
  constructor(message = "conflict") {
    super(message);
  }
}

export class ValidationError extends Error {
  readonly status = 400;
  constructor(message: string, public readonly fields?: Record<string, string[]>) {
    super(message);
  }
}

export function requirePermission(actor: Pick<Actor, "role">, permission: Permission) {
  if (!can(actor, permission)) throw new AuthorizationError(permission);
}
