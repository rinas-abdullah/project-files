import "server-only";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db/client";
import { users as usersTable, patients as patientsTable } from "@/lib/db/schema";
import { UserRole } from "@/lib/types/portal";
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

export function normalizePhone(phone: string): string {
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

export interface PendingAccount {
  id: string;
  role: UserRole;
  name: string;
  email: string | null;
  phone: string | null;
  passwordHash: string;
  mrn: string | null;
  department: string | null;
  hospital: string | null;
  deviceId: string | null;
}

async function checkContactAvailable(email: string | null, phone: string | null): Promise<string | null> {
  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(
      or(
        email ? eq(usersTable.email, email) : undefined,
        phone ? eq(usersTable.phone, phone) : undefined
      )
    );
  return existing ? "يوجد حساب مسجل مسبقاً بهذا البريد أو الرقم" : null;
}

export interface RegisterDoctorInput {
  name: string;
  email?: string;
  phone?: string;
  password: string;
  department?: string;
  hospital?: string;
}

export async function validateDoctorRegistration(
  input: RegisterDoctorInput
): Promise<{ success: true; data: PendingAccount } | { success: false; error: string }> {
  const name = input.name.trim();
  const email = input.email?.trim().toLowerCase() || null;
  const phone = input.phone ? normalizePhone(input.phone) : null;

  if (!name) return { success: false, error: "الاسم مطلوب" };
  if (!email && !phone) return { success: false, error: "أدخل بريدك الإلكتروني أو رقم جوالك" };
  if (input.password.length < 8) return { success: false, error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" };

  const conflict = await checkContactAvailable(email, phone);
  if (conflict) return { success: false, error: conflict };

  const passwordHash = await bcrypt.hash(input.password, 10);

  return {
    success: true,
    data: {
      id: `doc-${crypto.randomUUID()}`,
      role: "doctor",
      name,
      email,
      phone,
      passwordHash,
      mrn: null,
      department: input.department?.trim() || null,
      hospital: input.hospital?.trim() || null,
      deviceId: null,
    },
  };
}

export interface ActivatePatientInput {
  mrn: string;
  email?: string;
  phone?: string;
  password: string;
}

// Patients don't self-register a fresh identity — a clinical record (with an
// MRN) already exists in `patients`, created by hospital staff. Activation
// just links login credentials to that existing record, so it's verified
// against it rather than trusting whatever name/identity the form submits.
export async function validatePatientActivation(
  input: ActivatePatientInput
): Promise<{ success: true; data: PendingAccount } | { success: false; error: string }> {
  const mrn = input.mrn.trim();
  const email = input.email?.trim().toLowerCase() || null;
  const phone = input.phone ? normalizePhone(input.phone) : null;

  if (!mrn) return { success: false, error: "رقم الملف الطبي (MRN) مطلوب" };
  if (!email && !phone) return { success: false, error: "أدخل بريدك الإلكتروني أو رقم جوالك" };
  if (input.password.length < 8) return { success: false, error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" };

  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.mrn, mrn));
  if (!patient) {
    return { success: false, error: "لم يتم العثور على سجل مريض بهذا الرقم، تأكد من رقم الملف الطبي" };
  }

  const [alreadyActivated] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, patient.id));
  if (alreadyActivated) {
    return { success: false, error: "هذا الحساب مُفعّل بالفعل، سجّل دخولك مباشرة" };
  }

  const conflict = await checkContactAvailable(email, phone);
  if (conflict) return { success: false, error: conflict };

  const passwordHash = await bcrypt.hash(input.password, 10);

  return {
    success: true,
    data: {
      id: patient.id,
      role: "patient",
      name: patient.name,
      email,
      phone,
      passwordHash,
      mrn: patient.mrn,
      department: null,
      hospital: null,
      deviceId: null,
    },
  };
}

// Creates the account immediately, with no verification step — used only for
// phone-only sign-ups, since there is no free way to send a real SMS code
// yet. Email sign-ups go through startEmailVerification instead.
export async function createAccountDirectly(data: PendingAccount): Promise<SessionUser> {
  const [row] = await db
    .insert(usersTable)
    .values({
      id: data.id,
      name: data.name,
      role: data.role,
      email: data.email,
      phone: data.phone,
      passwordHash: data.passwordHash,
      mrn: data.mrn,
      department: data.department,
      hospital: data.hospital,
      deviceId: data.deviceId,
    })
    .returning();

  return toSessionUser(row);
}
