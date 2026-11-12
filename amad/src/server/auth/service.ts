import "server-only";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "../db";
import { audit } from "../audit";
import type { Actor } from "./rbac";
import { ValidationError } from "./rbac";

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const BCRYPT_COST = 12;
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_MAX_FAILURES = 5;
export const LOGIN_MAX_FAILURES_PER_IP = 20;

export const PasswordSchema = z
  .string()
  .min(10, "كلمة المرور يجب ألا تقل عن 10 أحرف")
  .max(128, "كلمة المرور طويلة جدًا")
  .regex(/[A-Za-z]/, "يجب أن تحتوي على حرف لاتيني واحد على الأقل")
  .regex(/[0-9]/, "يجب أن تحتوي على رقم واحد على الأقل");

export const RegisterSchema = z.object({
  name: z.string().trim().min(2, "الاسم قصير جدًا").max(80),
  email: z.email("بريد إلكتروني غير صالح").trim().toLowerCase().max(160),
  password: PasswordSchema,
  orgName: z.string().trim().min(2, "اسم المنظمة قصير جدًا").max(100),
  orgKind: z.enum(["INDIVIDUAL", "ENTERPRISE", "UNIVERSITY"]),
});

export const LoginSchema = z.object({
  email: z.email("بريد إلكتروني غير صالح").trim().toLowerCase(),
  password: z.string().min(1, "أدخل كلمة المرور").max(128),
});

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_COST);
}

function slugify(name: string) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32) || "org";
  return `${base}-${randomBytes(3).toString("hex")}`;
}

export interface RequestMeta {
  ip: string | null;
  userAgent: string | null;
}

/** Registers a user together with a new organization in which they are ORG_ADMIN. */
export async function register(input: unknown, meta: RequestMeta) {
  const parsed = RegisterSchema.safeParse(input);
  if (!parsed.success) throw new ValidationError("invalid-input", z.flattenError(parsed.error).fieldErrors as Record<string, string[]>);
  const { name, email, password, orgName, orgKind } = parsed.data;
  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) throw new ValidationError("email-taken", { email: ["هذا البريد مسجّل مسبقًا"] });
  const passwordHash = await hashPassword(password);
  const { user, org } = await db.$transaction(async (tx) => {
    const org = await tx.organization.create({ data: { name: orgName, slug: slugify(orgName), kind: orgKind } });
    const user = await tx.user.create({ data: { name, email, passwordHash } });
    await tx.membership.create({ data: { userId: user.id, orgId: org.id, role: "ORG_ADMIN" } });
    await audit({ action: "auth.register", orgId: org.id, userId: user.id, ip: meta.ip, targetType: "user", targetId: user.id }, tx);
    return { user, org };
  });
  const token = await createSession(user.id, org.id, meta);
  return { userId: user.id, orgId: org.id, token };
}

/**
 * Failed-login counters over a sliding window, stored in the audit log:
 *  - per account (email): stops brute force against one user,
 *  - per source IP (higher limit): stops password spraying without locking out
 *    every user behind a shared NAT after a few typos.
 */
async function isRateLimited(email: string, ip: string | null) {
  const since = new Date(Date.now() - LOGIN_WINDOW_MS);
  const base = { action: "auth.login.failed", createdAt: { gte: since } };
  const byEmail = await db.auditLog.count({ where: { ...base, meta: { path: ["email"], equals: email } } });
  if (byEmail >= LOGIN_MAX_FAILURES) return true;
  if (!ip) return false;
  return (await db.auditLog.count({ where: { ...base, ip } })) >= LOGIN_MAX_FAILURES_PER_IP;
}

export class RateLimitError extends Error {
  readonly status = 429;
  constructor() {
    super("rate-limited");
  }
}

// Dummy hash so unknown emails take the same time as wrong passwords.
let dummyHash: Promise<string> | null = null;
const getDummyHash = () => (dummyHash ??= bcrypt.hash(randomBytes(16).toString("hex"), BCRYPT_COST));

export async function login(input: unknown, meta: RequestMeta) {
  const parsed = LoginSchema.safeParse(input);
  if (!parsed.success) throw new ValidationError("invalid-input", z.flattenError(parsed.error).fieldErrors as Record<string, string[]>);
  const { email, password } = parsed.data;
  if (await isRateLimited(email, meta.ip)) {
    await audit({ action: "auth.login.rate_limited", ip: meta.ip, meta: { email } });
    throw new RateLimitError();
  }
  const user = await db.user.findUnique({
    where: { email },
    include: { memberships: { orderBy: { createdAt: "asc" }, take: 1 } },
  });
  const ok = await bcrypt.compare(password, user?.passwordHash ?? (await getDummyHash()));
  if (!user || !ok || user.memberships.length === 0) {
    await audit({ action: "auth.login.failed", userId: user?.id ?? null, ip: meta.ip, meta: { email } });
    throw new ValidationError("invalid-credentials");
  }
  const orgId = user.memberships[0].orgId;
  const token = await createSession(user.id, orgId, meta);
  await audit({ action: "auth.login", userId: user.id, orgId, ip: meta.ip });
  return { userId: user.id, orgId, token };
}

export async function createSession(userId: string, orgId: string, meta: RequestMeta) {
  const token = randomBytes(32).toString("base64url");
  await db.authSession.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      orgId,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      ip: meta.ip,
      userAgent: meta.userAgent?.slice(0, 300) ?? null,
    },
  });
  return token;
}

/** Resolves a raw session token to an Actor, or null if invalid/expired/revoked/no membership. */
export async function resolveSession(token: string | undefined | null): Promise<Actor | null> {
  if (!token || token.length > 100) return null;
  const session = await db.authSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true, org: true },
  });
  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;
  const membership = await db.membership.findUnique({ where: { userId_orgId: { userId: session.userId, orgId: session.orgId } } });
  if (!membership) return null;
  return {
    userId: session.userId,
    orgId: session.orgId,
    role: membership.role,
    isSuperAdmin: session.user.isSuperAdmin,
    name: session.user.name,
    email: session.user.email,
    orgName: session.org.name,
    orgIsDemo: session.org.isDemo,
    sessionId: session.id,
  };
}

export async function revokeSession(token: string, meta: RequestMeta) {
  const s = await db.authSession.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!s || s.revokedAt) return;
  await db.authSession.update({ where: { id: s.id }, data: { revokedAt: new Date() } });
  await audit({ action: "auth.logout", userId: s.userId, orgId: s.orgId, ip: meta.ip });
}

/** Revokes every active session of the actor except the current one. */
export async function revokeOtherSessions(actor: Actor, meta: RequestMeta) {
  const res = await db.authSession.updateMany({
    where: { userId: actor.userId, revokedAt: null, id: { not: actor.sessionId } },
    data: { revokedAt: new Date() },
  });
  await audit({ action: "auth.sessions.revoked", userId: actor.userId, orgId: actor.orgId, ip: meta.ip, meta: { count: res.count } });
  return res.count;
}

export async function listSessions(actor: Actor) {
  return db.authSession.findMany({
    where: { userId: actor.userId, revokedAt: null, expiresAt: { gt: new Date() } },
    select: { id: true, createdAt: true, ip: true, userAgent: true },
    orderBy: { createdAt: "desc" },
  });
}
