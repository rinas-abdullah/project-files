import type { Prisma } from "@prisma/client";
import type { CurrentUser } from "@/lib/session";

/**
 * Tenant isolation for patient encounters.
 *  - Platform roles (super admin, analyst, auditor): all encounters
 *  - EMS roles: encounters handled by ambulances of their own EMS organization
 *    (paramedics: only their assigned ambulance)
 *  - Hospital roles: encounters currently destined to their hospital, plus
 *    encounters diverted away from it (so they can see "CASE DIVERTED")
 */
export function encounterScope(user: Pick<CurrentUser, "role" | "organizationId" | "hospitalId" | "ambulanceId" | "orgType">): Prisma.PatientEncounterWhereInput {
  if (user.orgType === "PLATFORM") return {};
  if (user.orgType === "EMS") {
    if (user.role === "PARAMEDIC") {
      return { mission: { ambulanceId: user.ambulanceId ?? "__none__" } };
    }
    return { mission: { ambulance: { organizationId: user.organizationId } } };
  }
  const hid = user.hospitalId ?? "__none__";
  return {
    OR: [{ destinationHospitalId: hid }, { destinationHistory: { some: { fromHospitalId: hid } } }],
  };
}

export function ambulanceScope(user: Pick<CurrentUser, "orgType" | "organizationId">): Prisma.AmbulanceWhereInput {
  if (user.orgType === "EMS") return { organizationId: user.organizationId };
  return {};
}
