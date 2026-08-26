import "server-only";
import bcrypt from "bcryptjs";
import { SessionUser } from "./session";

interface DemoAccount {
  identifiers: string[]; // any of these (case-insensitive) matches this account
  passwordHash: string;
  profile: SessionUser;
}

// Demo credential store for this mock platform (no real user database yet).
// Passwords are bcrypt-hashed and can be overridden per-role via env vars so
// a deployment never has to ship with the documented defaults.
const DOCTOR_PASSWORD = process.env.DEMO_DOCTOR_PASSWORD || "Dithar@Doctor2026!";
const HOSPITAL_ADMIN_PASSWORD = process.env.DEMO_HOSPITAL_ADMIN_PASSWORD || "Dithar@Admin2026!";
const PATIENT_PASSWORD = process.env.DEMO_PATIENT_PASSWORD || "Dithar@Patient2026!";

function hashSync(password: string): string {
  return bcrypt.hashSync(password, 10);
}

const ACCOUNTS: DemoAccount[] = [
  {
    identifiers: ["dr.khalid@dithar.sa", "doctor"],
    passwordHash: hashSync(DOCTOR_PASSWORD),
    profile: {
      id: "doc-1",
      name: "د. خالد السليمان",
      role: "doctor",
      email: "dr.khalid@dithar.sa",
      department: "استشاري جراحة الأوعية الدموية والقدم السكرية",
      hospital: "مدينة الملك عبدالعزيز الطبية",
    },
  },
  {
    identifiers: ["admin@kfshrc.edu.sa", "hospital_admin", "admin"],
    passwordHash: hashSync(HOSPITAL_ADMIN_PASSWORD),
    profile: {
      id: "admin-1",
      name: "إدارة المنشأة — مستشفى الملك فيصل التخصصي",
      role: "hospital_admin",
      email: "admin@kfshrc.edu.sa",
      department: "إدارة التحول الرقمي وأسطول الأجهزة الطبية",
      hospital: "مستشفى الملك فيصل التخصصي ومركز الأبحاث",
    },
  },
  {
    identifiers: ["sara.alotaibi@dithar.sa", "#dh-8812", "dh-8812", "patient"],
    passwordHash: hashSync(PATIENT_PASSWORD),
    profile: {
      id: "pat-1",
      name: "سارة بنت أحمد العتيبي",
      role: "patient",
      mrn: "#DH-8812",
      email: "sara.alotaibi@dithar.sa",
      deviceId: "DITHAR-PAD-9842",
      hospital: "مدينة الملك فهد الطبية",
    },
  },
];

export async function verifyCredentials(identifier: string, password: string): Promise<SessionUser | null> {
  const normalized = identifier.trim().toLowerCase();
  const account = ACCOUNTS.find(a => a.identifiers.includes(normalized));
  if (!account) return null;

  const valid = await bcrypt.compare(password, account.passwordHash);
  if (!valid) return null;

  return account.profile;
}
