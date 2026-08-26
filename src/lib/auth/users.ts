import "server-only";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db/client";
import { users as usersTable } from "@/lib/db/schema";
import { SessionUser } from "./session";

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

function normalizePhone(phone: string): string {
  // Keep only digits and a leading +, so "05xxxxxxxx" and "+9665xxxxxxxx" style
  // variants of the same number match consistently.
  return phone.trim().replace(/[^\d+]/g, "");
}

export async function verifyCredentials(identifier: string, password: string): Promise<SessionUser | null> {
  const normalized = identifier.trim().toLowerCase();
  const normalizedPhone = normalizePhone(identifier);

  const [row] = await db
    .select()
    .from(usersTable)
    .where(or(eq(usersTable.email, normalized), eq(usersTable.phone, normalizedPhone)));

  if (!row) return null;

  const valid = await bcrypt.compare(password, row.passwordHash);
  if (!valid) return null;

  return toSessionUser(row);
}

export interface RegisterDoctorInput {
  name: string;
  email?: string;
  phone?: string;
  password: string;
  department?: string;
  hospital?: string;
}

export async function registerDoctor(input: RegisterDoctorInput): Promise<
  { success: true; user: SessionUser } | { success: false; error: string }
> {
  const name = input.name.trim();
  const email = input.email?.trim().toLowerCase() || null;
  const phone = input.phone ? normalizePhone(input.phone) : null;

  if (!name) return { success: false, error: "الاسم مطلوب" };
  if (!email && !phone) return { success: false, error: "أدخل بريدك الإلكتروني أو رقم جوالك" };
  if (input.password.length < 8) return { success: false, error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" };

  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(
      or(
        email ? eq(usersTable.email, email) : undefined,
        phone ? eq(usersTable.phone, phone) : undefined
      )
    );

  if (existing) {
    return { success: false, error: "يوجد حساب مسجل مسبقاً بهذا البريد أو الرقم" };
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const id = `doc-${crypto.randomUUID()}`;

  const [row] = await db
    .insert(usersTable)
    .values({
      id,
      name,
      role: "doctor",
      email,
      phone,
      passwordHash,
      department: input.department?.trim() || null,
      hospital: input.hospital?.trim() || null,
    })
    .returning();

  return { success: true, user: toSessionUser(row) };
}
