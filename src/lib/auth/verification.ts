import "server-only";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { emailVerifications, users as usersTable } from "@/lib/db/schema";
import { sendOtpEmail } from "@/lib/email/resend";
import { SessionUser } from "./session";

const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;

interface PendingPayload {
  name: string;
  phone: string | null;
  passwordHash: string;
  department: string | null;
  hospital: string | null;
}

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function toSessionUser(row: typeof usersTable.$inferSelect): SessionUser {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    mrn: row.mrn ?? undefined,
    department: row.department ?? undefined,
    hospital: row.hospital ?? undefined,
    deviceId: row.deviceId ?? undefined,
  };
}

export async function startEmailVerification(
  email: string,
  payload: PendingPayload
): Promise<{ success: true } | { success: false; error: string }> {
  const code = crypto.randomInt(100000, 1000000).toString();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  try {
    await sendOtpEmail(email, code, payload.name);
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "تعذر إرسال رمز التحقق" };
  }

  await db
    .insert(emailVerifications)
    .values({
      email,
      otpHash: hashCode(code),
      attempts: 0,
      payload: JSON.stringify(payload),
      expiresAt,
    })
    .onConflictDoUpdate({
      target: emailVerifications.email,
      set: { otpHash: hashCode(code), attempts: 0, payload: JSON.stringify(payload), expiresAt },
    });

  return { success: true };
}

export async function confirmEmailVerification(
  email: string,
  code: string
): Promise<{ success: true; user: SessionUser } | { success: false; error: string }> {
  const [pending] = await db.select().from(emailVerifications).where(eq(emailVerifications.email, email));

  if (!pending) {
    return { success: false, error: "لا يوجد طلب تحقق نشط لهذا البريد، أعد التسجيل" };
  }
  if (pending.expiresAt < new Date()) {
    await db.delete(emailVerifications).where(eq(emailVerifications.email, email));
    return { success: false, error: "انتهت صلاحية الرمز، أعد التسجيل للحصول على رمز جديد" };
  }
  if (pending.attempts >= MAX_ATTEMPTS) {
    await db.delete(emailVerifications).where(eq(emailVerifications.email, email));
    return { success: false, error: "تجاوزت عدد المحاولات المسموح، أعد التسجيل" };
  }
  if (hashCode(code) !== pending.otpHash) {
    await db
      .update(emailVerifications)
      .set({ attempts: pending.attempts + 1 })
      .where(eq(emailVerifications.email, email));
    return { success: false, error: "رمز التحقق غير صحيح" };
  }

  const payload: PendingPayload = JSON.parse(pending.payload);
  const id = `doc-${crypto.randomUUID()}`;

  const [row] = await db
    .insert(usersTable)
    .values({
      id,
      name: payload.name,
      role: "doctor",
      email,
      phone: payload.phone,
      passwordHash: payload.passwordHash,
      department: payload.department,
      hospital: payload.hospital,
    })
    .returning();

  await db.delete(emailVerifications).where(eq(emailVerifications.email, email));

  return { success: true, user: toSessionUser(row) };
}
