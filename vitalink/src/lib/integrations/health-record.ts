import "server-only";
import { integrationStatus, isUsable, IntegrationUnavailableError } from "./registry";
import { seeded, pick } from "./synthetic";

export type HealthProfileData = {
  source: string;
  bloodType: string | null;
  allergies: string[];
  chronicConditions: string[];
  medicalAlerts: string[];
  medicationHistory: { name: string; dose: string }[];
  criticalDiagnoses: string[];
};

/** Contract for national health-record exchanges (NPHIES / HIE / EHR). */
export interface HealthRecordAdapter {
  readonly source: string;
  fetchProfile(req: { nationalId: string }): Promise<HealthProfileData>;
}

const ALLERGIES = ["Penicillin", "Sulfa drugs", "Latex", "Aspirin", "Contrast media", "Peanuts", "Morphine"];
const CHRONIC = ["Type 2 diabetes", "Hypertension", "Asthma", "Chronic kidney disease (stage 3)", "Atrial fibrillation", "Coronary artery disease", "Hypothyroidism", "Epilepsy", "Sickle cell disease"];
const ALERTS = ["Anticoagulated — bleeding risk", "Pacemaker in situ", "Difficult airway history", "Do not give NSAIDs", "Pregnancy (2nd trimester)", "Known G6PD deficiency"];
const MEDS: [string, string][] = [["Metformin", "500 mg BID"], ["Amlodipine", "5 mg OD"], ["Atorvastatin", "40 mg OD"], ["Warfarin", "5 mg OD"], ["Salbutamol inhaler", "PRN"], ["Insulin glargine", "20 IU nightly"], ["Bisoprolol", "2.5 mg OD"], ["Levetiracetam", "500 mg BID"]];
const DX = ["Previous NSTEMI (2023)", "Prior ischemic stroke", "Chronic heart failure (EF 35%)", "Pulmonary embolism history", "COPD"];
const BLOOD = ["O+", "A+", "B+", "AB+", "O-", "A-", "B-"];

function some<T>(rnd: () => number, arr: readonly T[], max: number): T[] {
  const n = Math.floor(rnd() * (max + 1));
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length; i++) out.push(copy.splice(Math.floor(rnd() * copy.length), 1)[0]);
  return out;
}

/** MockHealthRecordAdapter (NPHIES simulated) — synthetic, deterministic profiles. Never contacts NPHIES. */
export class MockHealthRecordAdapter implements HealthRecordAdapter {
  readonly source = "NPHIES / Health Records (simulated)";
  async fetchProfile(req: { nationalId: string }): Promise<HealthProfileData> {
    await new Promise((r) => setTimeout(r, 300));
    const rnd = seeded(`hr:${req.nationalId}`);
    return {
      source: this.source,
      bloodType: pick(rnd, BLOOD),
      allergies: some(rnd, ALLERGIES, 2),
      chronicConditions: some(rnd, CHRONIC, 3),
      medicalAlerts: some(rnd, ALERTS, 1),
      medicationHistory: some(rnd, MEDS, 3).map(([name, dose]) => ({ name, dose })),
      criticalDiagnoses: some(rnd, DX, 1),
    };
  }
}

export class NphiesAdapter implements HealthRecordAdapter {
  readonly source = "NPHIES";
  async fetchProfile(): Promise<HealthProfileData> {
    if (!process.env.NPHIES_API_URL || !process.env.NPHIES_CLIENT_ID) throw new IntegrationUnavailableError("NPHIES", "NOT_CONFIGURED");
    throw new IntegrationUnavailableError("NPHIES", "NOT_CONNECTED");
  }
}

export async function getHealthRecordAdapter(): Promise<HealthRecordAdapter> {
  const status = await integrationStatus("NPHIES");
  if (status === "SIMULATED") return new MockHealthRecordAdapter();
  if (isUsable(status)) return new NphiesAdapter();
  throw new IntegrationUnavailableError("NPHIES", status);
}
