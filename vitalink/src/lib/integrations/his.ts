import "server-only";
import { integrationStatus, isUsable, IntegrationUnavailableError } from "./registry";

export type RegistrationRequest = {
  encounterCode: string;
  hospitalCode: string;
  patientName: string;
  sex: string;
  age: number | null;
  nationalIdLast4: string | null;
  chiefComplaint: string;
  priority: string;
};

export type RegistrationResult = { status: "REGISTRATION_CONFIRMED" | "REGISTRATION_FAILED"; reference?: string; message: string };

/** Contract for hospital information systems (HL7 v2 ADT^A04 / FHIR Encounter). */
export interface HisAdapter {
  readonly name: string;
  preRegister(req: RegistrationRequest): Promise<RegistrationResult>;
}

/** Mock HIS — simulates an ADT pre-registration acknowledgment. No real HIS is contacted. */
export class MockHisAdapter implements HisAdapter {
  readonly name = "Hospital HIS (simulated)";
  async preRegister(req: RegistrationRequest): Promise<RegistrationResult> {
    await new Promise((r) => setTimeout(r, 250));
    if (!req.patientName || !req.hospitalCode) return { status: "REGISTRATION_FAILED", message: "MISSING_DEMOGRAPHICS" };
    const mrn = `SIM-MRN-${req.hospitalCode}-${req.encounterCode.slice(-5)}`;
    return { status: "REGISTRATION_CONFIRMED", reference: mrn, message: "ADT_A04_ACK_SIMULATED" };
  }
}

export async function getHisAdapter(): Promise<HisAdapter> {
  const status = await integrationStatus("HIS");
  if (status === "SIMULATED") return new MockHisAdapter();
  if (isUsable(status)) throw new IntegrationUnavailableError("HIS", "NOT_CONNECTED");
  throw new IntegrationUnavailableError("HIS", status);
}
