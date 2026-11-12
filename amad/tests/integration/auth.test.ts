import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { login, register, resolveSession, revokeOtherSessions, revokeSession, LOGIN_MAX_FAILURES, LOGIN_MAX_FAILURES_PER_IP } from "@/server/auth/service";
import { META, PASSWORD } from "../support/actors";
import { resetDb } from "../support/db";

beforeEach(resetDb);

describe("authentication", () => {
  it("registers a user as ORG_ADMIN of a new organization and stores only a password hash", async () => {
    const r = await register({ name: "Noura", email: "Noura@Example.com", password: PASSWORD, orgName: "Acme", orgKind: "UNIVERSITY" }, META);
    const user = await db.user.findUniqueOrThrow({ where: { id: r.userId } });
    expect(user.email).toBe("noura@example.com");
    expect(user.passwordHash).not.toContain(PASSWORD);
    expect(user.passwordHash.startsWith("$2")).toBe(true);
    const actor = await resolveSession(r.token);
    expect(actor).toMatchObject({ role: "ORG_ADMIN", orgName: "Acme" });
    const stored = await db.authSession.findFirstOrThrow({ where: { userId: r.userId } });
    expect(stored.tokenHash).not.toBe(r.token);
    expect(await db.auditLog.count({ where: { action: "auth.register" } })).toBe(1);
  });

  it("rejects weak passwords and duplicate emails", async () => {
    await expect(register({ name: "X Y", email: "a@b.co", password: "short", orgName: "Org", orgKind: "INDIVIDUAL" }, META)).rejects.toMatchObject({ status: 400 });
    await register({ name: "X Y", email: "dup@b.co", password: PASSWORD, orgName: "Org", orgKind: "INDIVIDUAL" }, META);
    await expect(register({ name: "X Y", email: "dup@b.co", password: PASSWORD, orgName: "Org2", orgKind: "INDIVIDUAL" }, META)).rejects.toMatchObject({ message: "email-taken" });
  });

  it("logs in with correct credentials only, and rate-limits repeated failures", async () => {
    await register({ name: "Login User", email: "login@b.co", password: PASSWORD, orgName: "Org", orgKind: "INDIVIDUAL" }, META);
    const ok = await login({ email: "login@b.co", password: PASSWORD }, META);
    expect(await resolveSession(ok.token)).not.toBeNull();
    await expect(login({ email: "login@b.co", password: "wrong-password1" }, META)).rejects.toMatchObject({ message: "invalid-credentials" });
    await expect(login({ email: "nobody@b.co", password: "wrong-password1" }, META)).rejects.toMatchObject({ message: "invalid-credentials" });
    for (let i = 0; i < LOGIN_MAX_FAILURES; i++) await login({ email: "login@b.co", password: "bad" + i }, { ip: "10.9.9.9", userAgent: null }).catch(() => {});
    await expect(login({ email: "login@b.co", password: PASSWORD }, { ip: "10.9.9.9", userAgent: null })).rejects.toMatchObject({ status: 429 });
  });

  it("a few failures from a shared IP do not lock out other accounts, but spraying does", async () => {
    await register({ name: "Other User", email: "other@b.co", password: PASSWORD, orgName: "Org", orgKind: "INDIVIDUAL" }, META);
    const nat = { ip: "10.1.1.1", userAgent: null };
    for (let i = 0; i < LOGIN_MAX_FAILURES; i++) await login({ email: `typo${i}@b.co`, password: "bad-pass-1" }, nat).catch(() => {});
    await expect(login({ email: "other@b.co", password: PASSWORD }, nat)).resolves.toBeTruthy();
    for (let i = LOGIN_MAX_FAILURES; i < LOGIN_MAX_FAILURES_PER_IP; i++) await login({ email: `spray${i}@b.co`, password: "bad-pass-1" }, nat).catch(() => {});
    await expect(login({ email: "other@b.co", password: PASSWORD }, nat)).rejects.toMatchObject({ status: 429 });
    await expect(login({ email: "other@b.co", password: PASSWORD }, { ip: "10.2.2.2", userAgent: null })).resolves.toBeTruthy();
  });

  it("logout revokes the session; other sessions can be revoked together", async () => {
    const r = await register({ name: "Multi", email: "multi@b.co", password: PASSWORD, orgName: "Org", orgKind: "INDIVIDUAL" }, META);
    const second = await login({ email: "multi@b.co", password: PASSWORD }, META);
    const actor = (await resolveSession(r.token))!;
    expect(await revokeOtherSessions(actor, META)).toBe(1);
    expect(await resolveSession(second.token)).toBeNull();
    expect(await resolveSession(r.token)).not.toBeNull();
    await revokeSession(r.token, META);
    expect(await resolveSession(r.token)).toBeNull();
  });

  it("rejects expired and unknown tokens", async () => {
    const r = await register({ name: "Exp", email: "exp@b.co", password: PASSWORD, orgName: "Org", orgKind: "INDIVIDUAL" }, META);
    await db.authSession.updateMany({ where: { userId: r.userId }, data: { expiresAt: new Date(Date.now() - 1000) } });
    expect(await resolveSession(r.token)).toBeNull();
    expect(await resolveSession("not-a-real-token")).toBeNull();
  });
});
