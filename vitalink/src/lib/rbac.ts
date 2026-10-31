import type { RoleKey } from "@prisma/client";

export const PERMISSIONS = [
  "case:read",
  "case:create",
  "case:clinical_write",
  "case:acknowledge",
  "case:prepare",
  "handover:start",
  "handover:receive",
  "ambulance:release",
  "identity:verify",
  "health:read",
  "media:read",
  "media:upload",
  "triage:run",
  "triage:decide",
  "destination:recommend",
  "destination:select_initial",
  "destination:change",
  "recommendation:approve",
  "dispatch:manage",
  "command:read",
  "hospital:resources",
  "hospital:capabilities",
  "analytics:read",
  "reports:read",
  "audit:read",
  "integrations:read",
  "integrations:manage",
  "users:read",
  "demo:run",
  "alerts:manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ED_CLINICAL: Permission[] = [
  "case:read",
  "case:acknowledge",
  "case:prepare",
  "handover:receive",
  "health:read",
  "media:read",
  "alerts:manage",
];

export const ROLE_PERMISSIONS: Record<RoleKey, Permission[]> = {
  SUPER_ADMIN: [...PERMISSIONS],
  EMS_ADMIN: [
    "case:read",
    "media:read",
    "health:read",
    "dispatch:manage",
    "destination:change",
    "recommendation:approve",
    "destination:recommend",
    "command:read",
    "analytics:read",
    "reports:read",
    "audit:read",
    "integrations:read",
    "users:read",
    "demo:run",
    "alerts:manage",
    "ambulance:release",
  ],
  EMS_DISPATCH: [
    "case:read",
    "media:read",
    "dispatch:manage",
    "destination:change",
    "recommendation:approve",
    "destination:recommend",
    "command:read",
    "demo:run",
    "alerts:manage",
    "ambulance:release",
  ],
  PARAMEDIC: [
    "case:read",
    "case:create",
    "case:clinical_write",
    "identity:verify",
    "health:read",
    "media:read",
    "media:upload",
    "triage:run",
    "triage:decide",
    "destination:recommend",
    "destination:select_initial",
    "handover:start",
    "ambulance:release",
  ],
  ED_ADMIN: [...ED_CLINICAL, "hospital:resources", "hospital:capabilities", "analytics:read", "reports:read", "audit:read", "users:read"],
  ED_NURSE: [...ED_CLINICAL],
  ED_DOCTOR: [...ED_CLINICAL],
  HOSPITAL_COORDINATOR: [...ED_CLINICAL, "hospital:resources", "command:read", "reports:read"],
  OPERATIONS_ANALYST: ["case:read", "command:read", "analytics:read", "reports:read"],
  AUDITOR: ["case:read", "audit:read", "reports:read", "integrations:read"],
};

export const ROLE_LABELS: Record<RoleKey, { en: string; ar: string; description: string }> = {
  SUPER_ADMIN: { en: "Super Admin", ar: "مدير النظام", description: "Full platform administration" },
  EMS_ADMIN: { en: "EMS Admin", ar: "مدير الإسعاف", description: "EMS operator administration and oversight" },
  EMS_DISPATCH: { en: "EMS Dispatch", ar: "مركز التوجيه", description: "Dispatch, destination approval and diversion" },
  PARAMEDIC: { en: "Paramedic", ar: "مسعف", description: "Ambulance crew — clinical documentation in the field" },
  ED_ADMIN: { en: "ED Admin", ar: "مدير الطوارئ", description: "Emergency department administration and resources" },
  ED_NURSE: { en: "ED Nurse", ar: "تمريض الطوارئ", description: "Receives, acknowledges and prepares incoming cases" },
  ED_DOCTOR: { en: "ED Doctor", ar: "طبيب الطوارئ", description: "Reviews incoming cases and receives handover" },
  HOSPITAL_COORDINATOR: { en: "Hospital Coordinator", ar: "منسق المستشفى", description: "Bed flow, readiness and resource coordination" },
  OPERATIONS_ANALYST: { en: "Operations Analyst", ar: "محلل العمليات", description: "Analytics, KPIs and reports" },
  AUDITOR: { en: "Auditor", ar: "مدقق", description: "Read-only audit and compliance review" },
};

export const EMS_ROLES: RoleKey[] = ["EMS_ADMIN", "EMS_DISPATCH", "PARAMEDIC"];
export const HOSPITAL_ROLES: RoleKey[] = ["ED_ADMIN", "ED_NURSE", "ED_DOCTOR", "HOSPITAL_COORDINATOR"];
export const PLATFORM_ROLES: RoleKey[] = ["SUPER_ADMIN", "OPERATIONS_ANALYST", "AUDITOR"];

export function can(role: RoleKey, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function homeFor(role: RoleKey): string {
  switch (role) {
    case "PARAMEDIC":
      return "/paramedic";
    case "EMS_DISPATCH":
    case "EMS_ADMIN":
      return "/dispatch";
    case "ED_ADMIN":
    case "ED_NURSE":
    case "ED_DOCTOR":
    case "HOSPITAL_COORDINATOR":
      return "/ed";
    case "OPERATIONS_ANALYST":
      return "/analytics";
    case "AUDITOR":
      return "/admin/audit";
    case "SUPER_ADMIN":
    default:
      return "/command";
  }
}
