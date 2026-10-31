import type { RoleKey } from "@prisma/client";
import { can } from "@/lib/rbac";
import type { NavSection } from "@/components/app/app-shell";

export function buildNav(role: RoleKey): NavSection[] {
  const ops: NavSection["items"] = [];
  if (can(role, "command:read")) ops.push({ href: "/command", key: "command" });
  if (can(role, "dispatch:manage")) ops.push({ href: "/dispatch", key: "dispatch" });
  if (role === "PARAMEDIC") ops.push({ href: "/paramedic", key: "paramedic" });
  if (can(role, "case:acknowledge")) ops.push({ href: "/ed", key: "ed" });
  if (can(role, "hospital:resources")) ops.push({ href: "/ed/resources", key: "resources" });
  if (can(role, "command:read")) ops.push({ href: "/mci", key: "mci" });

  const clinical: NavSection["items"] = [];
  if (can(role, "case:read") && role !== "PARAMEDIC") clinical.push({ href: "/cases", key: "cases" });
  if (can(role, "case:read") && role !== "PARAMEDIC" && !["ED_NURSE", "ED_DOCTOR", "ED_ADMIN", "HOSPITAL_COORDINATOR"].includes(role)) clinical.push({ href: "/incidents", key: "incidents" });
  if (can(role, "case:read")) clinical.push({ href: "/alerts", key: "alerts" });
  clinical.push({ href: "/notifications", key: "notifications" });

  const insights: NavSection["items"] = [];
  if (can(role, "analytics:read")) insights.push({ href: "/analytics", key: "analytics" });
  if (can(role, "reports:read")) insights.push({ href: "/reports", key: "reports" });

  const admin: NavSection["items"] = [];
  if (can(role, "audit:read")) admin.push({ href: "/admin/audit", key: "audit" });
  if (can(role, "integrations:read")) admin.push({ href: "/admin/integrations", key: "integrations" });
  if (can(role, "users:read")) admin.push({ href: "/admin/users", key: "users" });
  if (can(role, "demo:run")) admin.push({ href: "/demo", key: "demo" });

  return [
    { key: "sectionOperations" as const, items: ops },
    { key: "sectionClinical" as const, items: clinical },
    { key: "sectionInsights" as const, items: insights },
    { key: "sectionAdmin" as const, items: admin },
  ].filter((s) => s.items.length);
}
